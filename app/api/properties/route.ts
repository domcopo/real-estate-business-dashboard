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

    // Build query - always filter by user_id to ensure we get all user's properties
    // This ensures properties are found even if workspace system has issues
    // We filter by user_id first, which will get all properties for this user
    // regardless of workspace_id value (null, workspace_id, etc.)
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('user_id', userId) // Always filter by user_id - this is the primary filter
      .order('created_at', { ascending: false })

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

    // Use upsert to update/insert properties without deleting others
    // This prevents data loss - properties not in the list won't be deleted
    // Only properties explicitly sent will be updated or inserted
    console.log(`Received ${properties.length} properties to save`)
    
    const propertiesToInsert = properties
      .map((prop: any, index: number) => {
        // Trim and check required fields - treat empty strings as missing
        const address = prop.address ? String(prop.address).trim() : ''
        const type = prop.type ? String(prop.type).trim() : ''
        const status = prop.status ? String(prop.status).trim() : ''
        
        // Validate required fields - skip invalid ones instead of throwing
        if (!address || !type || !status) {
          console.warn(`Skipping property at index ${index} - missing required fields: address="${address}", type="${type}", status="${status}"`)
          return null
        }

        // Validate status is one of the allowed values
        const validStatuses = ['rented', 'vacant', 'under_maintenance', 'sold']
        if (!validStatuses.includes(status)) {
          console.warn(`Skipping property at index ${index} - invalid status: "${status}". Must be one of: ${validStatuses.join(', ')}`)
          return null
        }

      // Build the property object, excluding fields that don't belong in the properties table
      const propertyToInsert: any = {
        user_id: userId,
        workspace_id: targetWorkspaceId || null, // Allow null if workspace system isn't set up
        address: address,
        type: type,
        status: status,
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
      // Don't include ID if it's not a UUID (e.g., temporary IDs like "1", "2", etc.)
      if (prop.id && typeof prop.id === 'string') {
        const isUUID = prop.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        if (isUUID) {
          propertyToInsert.id = prop.id
        } else {
          // Temporary ID (like "1", "2", etc.) - don't include it, let database generate new UUID
          console.log(`Property has temporary ID "${prop.id}", will get new UUID from database`)
        }
      }

      // Note: We intentionally exclude:
      // - id (database generates it)
      // - rentRoll (stored in rent_roll_units table)
      // - workRequests (stored in work_requests table)

        return propertyToInsert
      })
      .filter((p: any) => p !== null) // Remove null entries (invalid properties)

    console.log(`After validation: ${propertiesToInsert.length} valid properties out of ${properties.length} total`)
    
    if (propertiesToInsert.length === 0) {
      console.error('All properties were filtered out during validation')
      return NextResponse.json(
        { error: 'No valid properties to save. All properties were missing required fields (address, type, status) or had invalid status values.' },
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

