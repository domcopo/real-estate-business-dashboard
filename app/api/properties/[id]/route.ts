import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * PUT /api/properties/[id] - Update a single property
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const propertyId = params.id
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('properties')
      .update({
        address: body.address,
        type: body.type,
        status: body.status,
        mortgage_holder: body.mortgageHolder || null,
        purchase_price: body.purchasePrice || 0,
        current_est_value: body.currentEstValue || 0,
        monthly_mortgage_payment: body.monthlyMortgagePayment || 0,
        monthly_insurance: body.monthlyInsurance || 0,
        monthly_property_tax: body.monthlyPropertyTax || 0,
        monthly_other_costs: body.monthlyOtherCosts || 0,
        monthly_gross_rent: body.monthlyGrossRent || 0,
        ownership: body.ownership || null,
        linked_websites: body.linkedWebsites || null,
      })
      .eq('id', propertyId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating property:', error)
      return NextResponse.json(
        { error: 'Failed to update property', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, property: data })
  } catch (error: any) {
    console.error('Error in PUT /api/properties/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

