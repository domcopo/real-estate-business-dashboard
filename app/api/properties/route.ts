import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserWorkspace, getUserWorkspaces } from '@/lib/workspace-helpers'

/**
 * GET /api/properties - Fetch workspace properties
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get user's workspaces (handle case where workspace tables don't exist yet)
    let workspaceIds: string[] = []
    try {
      const workspaces = await getUserWorkspaces(userId)
      workspaceIds = workspaces.map(w => w.id)
    } catch (workspaceError: any) {
      // If workspace tables don't exist, fall back to user_id filtering
      console.warn('Could not fetch workspaces, falling back to user_id filter:', workspaceError.message)
    }

    // Build query - always filter by user_id, and optionally by workspace_id
    // This ensures we get all properties for the user, regardless of workspace setup
    let query = supabaseAdmin
      .from('properties')
      .select('*')
      .eq('user_id', userId) // Always filter by user_id
    
    // Additionally filter by workspace if available
    if (workspaceIds.length > 0) {
      // Get properties that belong to user's workspaces OR have null workspace_id (legacy)
      query = query.or(`workspace_id.in.(${workspaceIds.join(',')}),workspace_id.is.null`)
    }
    // If no workspaces, we already have user_id filter, which will get all user's properties
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json(
        { error: 'Failed to fetch properties', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ properties: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/properties - Save properties (replace all)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { properties, workspaceId } = body

    if (!Array.isArray(properties)) {
      console.error('Invalid request: properties is not an array', { properties })
      return NextResponse.json(
        { error: 'Invalid request: properties must be an array' },
        { status: 400 }
      )
    }

    if (properties.length === 0) {
      console.warn('Empty properties array received')
      return NextResponse.json(
        { error: 'No properties to save' },
        { status: 400 }
      )
    }

    // Get or create workspace (handle case where workspace tables don't exist yet)
    let targetWorkspaceId: string | null = workspaceId || null
    try {
      const workspace = await getOrCreateUserWorkspace(userId)
      targetWorkspaceId = workspaceId || workspace.id
    } catch (workspaceError: any) {
      // If workspace tables don't exist, we'll use null and rely on user_id
      console.warn('Could not get/create workspace, using user_id only:', workspaceError.message)
      targetWorkspaceId = null
    }

    // Use upsert instead of delete-all + insert to prevent data loss
    // First, get existing property IDs to preserve ones not being updated
    let existingQuery = supabaseAdmin.from('properties').select('id')
    if (targetWorkspaceId) {
      existingQuery = existingQuery.eq('workspace_id', targetWorkspaceId)
    } else {
      existingQuery = existingQuery.eq('user_id', userId)
    }
    
    const { data: existingProperties } = await existingQuery
    const existingIds = new Set((existingProperties || []).map((p: any) => p.id))
    const incomingIds = new Set(properties.map((p: any) => p.id).filter(Boolean))
    
    // Properties to delete (exist in DB but not in incoming list)
    const idsToDelete = Array.from(existingIds).filter(id => !incomingIds.has(id))
    
    // Delete properties that are no longer in the list
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('properties')
        .delete()
        .in('id', idsToDelete)
      
      if (deleteError) {
        console.error('Error deleting removed properties:', deleteError)
        // Continue - this is not critical
      }
    }

    // Upsert properties (insert or update)
    const propertiesToInsert = properties.map((prop: any, index: number) => {
      // Validate required fields
      if (!prop.address || !prop.type || !prop.status) {
        throw new Error(`Property at index ${index} missing required fields: address="${prop.address}", type="${prop.type}", status="${prop.status}"`)
      }

      // Validate status is one of the allowed values
      const validStatuses = ['rented', 'vacant', 'under_maintenance', 'sold']
      if (!validStatuses.includes(prop.status)) {
        throw new Error(`Property at index ${index} has invalid status: "${prop.status}". Must be one of: ${validStatuses.join(', ')}`)
      }

      // Build the property object, excluding fields that don't belong in the properties table
      const propertyToInsert: any = {
        user_id: userId,
        workspace_id: targetWorkspaceId || null, // Allow null if workspace system isn't set up
        address: String(prop.address).trim(),
        type: String(prop.type).trim(),
        status: String(prop.status).trim(),
        mortgage_holder: prop.mortgageHolder ? String(prop.mortgageHolder).trim() : null,
        purchase_price: Number(prop.purchasePrice) || 0,
        current_est_value: Number(prop.currentEstValue) || 0,
        monthly_mortgage_payment: Number(prop.monthlyMortgagePayment) || 0,
        monthly_insurance: Number(prop.monthlyInsurance) || 0,
        monthly_property_tax: Number(prop.monthlyPropertyTax) || 0,
        monthly_other_costs: Number(prop.monthlyOtherCosts) || 0,
        monthly_gross_rent: Number(prop.monthlyGrossRent) || 0,
        ownership: prop.ownership ? String(prop.ownership).trim() : null,
        linked_websites: Array.isArray(prop.linkedWebsites) && prop.linkedWebsites.length > 0 ? prop.linkedWebsites : null,
      }
      
      // Preserve ID if it exists and is a valid UUID (from database)
      // This allows upsert to update existing properties
      if (prop.id && typeof prop.id === 'string' && prop.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        propertyToInsert.id = prop.id
      }

      // Note: We intentionally exclude:
      // - id (database generates it)
      // - rentRoll (stored in rent_roll_units table)
      // - workRequests (stored in work_requests table)

      return propertyToInsert
    })

    if (propertiesToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No properties to save' },
        { status: 400 }
      )
    }

    // Use upsert to update existing properties or insert new ones
    // Only include id in conflict resolution if we have IDs
    const hasIds = propertiesToInsert.some((p: any) => p.id)
    const upsertOptions: any = {
      ignoreDuplicates: false,
    }
    
    if (hasIds) {
      upsertOptions.onConflict = 'id' // If id exists, update; otherwise insert
    }
    
    const { data, error: insertError } = await supabaseAdmin
      .from('properties')
      .upsert(propertiesToInsert, upsertOptions)
      .select()

    if (insertError) {
      console.error('Error upserting properties:', insertError)
      console.error('Properties attempted:', JSON.stringify(propertiesToInsert.slice(0, 2), null, 2)) // Log first 2 only
      return NextResponse.json(
        { error: 'Failed to save properties', details: insertError.message },
        { status: 500 }
      )
    }

    console.log(`Successfully saved ${data?.length || 0} properties`)

    return NextResponse.json({ 
      success: true, 
      properties: data || [],
      message: `Saved ${data?.length || 0} properties` 
    })
  } catch (error: any) {
    console.error('Error in POST /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

