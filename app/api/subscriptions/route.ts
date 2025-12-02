import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/subscriptions - Fetch user's subscriptions
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

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('renewal_date', { ascending: true })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ subscriptions: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions - Save subscriptions (replace all)
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
    const { subscriptions, workspaceId } = body

    if (!Array.isArray(subscriptions)) {
      return NextResponse.json(
        { error: 'Invalid request: subscriptions must be an array' },
        { status: 400 }
      )
    }

    // Delete existing subscriptions for this user
    const { error: deleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing subscriptions:', deleteError)
      // Continue anyway - might be first time saving
    }

    // Insert new subscriptions
    const subscriptionsToInsert = subscriptions.map((sub: any) => ({
      user_id: userId,
      workspace_id: workspaceId || null,
      name: sub.name,
      cost: sub.cost || 0,
      period: sub.period,
      renewal_date: sub.renewalDate,
      category: sub.category,
      website_id: sub.websiteId || null,
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting subscriptions:', insertError)
      return NextResponse.json(
        { error: 'Failed to save subscriptions', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      subscriptions: data,
      message: `Saved ${data.length} subscriptions` 
    })
  } catch (error: any) {
    console.error('Error in POST /api/subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

