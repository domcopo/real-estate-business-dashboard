import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/properties - Fetch user's properties
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    const userId = user?.id
    
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

    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('user_id', userId)
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
    const user = await currentUser()
    const userId = user?.id
    
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
      return NextResponse.json(
        { error: 'Invalid request: properties must be an array' },
        { status: 400 }
      )
    }

    // Delete existing properties for this user
    const { error: deleteError } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing properties:', deleteError)
      // Continue anyway - might be first time saving
    }

    // Insert new properties
    const propertiesToInsert = properties.map((prop: any) => ({
      user_id: userId,
      workspace_id: workspaceId || null,
      address: prop.address,
      type: prop.type,
      status: prop.status,
      mortgage_holder: prop.mortgageHolder || null,
      purchase_price: prop.purchasePrice || 0,
      current_est_value: prop.currentEstValue || 0,
      monthly_mortgage_payment: prop.monthlyMortgagePayment || 0,
      monthly_insurance: prop.monthlyInsurance || 0,
      monthly_property_tax: prop.monthlyPropertyTax || 0,
      monthly_other_costs: prop.monthlyOtherCosts || 0,
      monthly_gross_rent: prop.monthlyGrossRent || 0,
      ownership: prop.ownership || null,
      linked_websites: prop.linkedWebsites || null,
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from('properties')
      .insert(propertiesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting properties:', insertError)
      return NextResponse.json(
        { error: 'Failed to save properties', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      properties: data,
      message: `Saved ${data.length} properties` 
    })
  } catch (error: any) {
    console.error('Error in POST /api/properties:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

