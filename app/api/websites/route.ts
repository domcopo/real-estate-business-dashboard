import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/websites - Fetch user's websites
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
      .from('websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching websites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch websites', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ websites: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/websites:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/websites - Save websites (replace all)
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
    const { websites, workspaceId } = body

    if (!Array.isArray(websites)) {
      return NextResponse.json(
        { error: 'Invalid request: websites must be an array' },
        { status: 400 }
      )
    }

    // Delete existing websites for this user
    const { error: deleteError } = await supabaseAdmin
      .from('websites')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing websites:', deleteError)
      // Continue anyway - might be first time saving
    }

    // Insert new websites
    const websitesToInsert = websites.map((site: any) => ({
      user_id: userId,
      workspace_id: workspaceId || null,
      url: site.url,
      name: site.name,
      tech_stack: site.techStack || {},
      linked_blops: site.linkedBlops || null,
      subscription_ids: site.subscriptionIds || null,
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from('websites')
      .insert(websitesToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting websites:', insertError)
      return NextResponse.json(
        { error: 'Failed to save websites', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      websites: data,
      message: `Saved ${data.length} websites` 
    })
  } catch (error: any) {
    console.error('Error in POST /api/websites:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

