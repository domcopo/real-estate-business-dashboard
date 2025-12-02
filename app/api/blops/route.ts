import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserWorkspace, getUserWorkspaces } from '@/lib/workspace-helpers'

/**
 * GET /api/blops - Fetch workspace blops
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

    // Get user's workspace
    const workspace = await getOrCreateUserWorkspace(userId)
    
    // Get all workspaces user has access to
    const workspaces = await getUserWorkspaces(userId)
    const workspaceIds = workspaces.map(w => w.id)

    const { data, error } = await supabaseAdmin
      .from('blops')
      .select('*')
      .in('workspace_id', workspaceIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching blops:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blops', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ blops: data || [] })
  } catch (error: any) {
    console.error('Error in GET /api/blops:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/blops - Save blops (replace all)
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
    const { blops, workspaceId } = body

    if (!Array.isArray(blops)) {
      return NextResponse.json(
        { error: 'Invalid request: blops must be an array' },
        { status: 400 }
      )
    }

    // Get or create workspace
    const workspace = await getOrCreateUserWorkspace(userId)
    const targetWorkspaceId = workspaceId || workspace.id

    // Delete existing blops for this workspace
    const { error: deleteError } = await supabaseAdmin
      .from('blops')
      .delete()
      .eq('workspace_id', targetWorkspaceId)

    if (deleteError) {
      console.error('Error deleting existing blops:', deleteError)
      // Continue anyway - might be first time saving
    }

    // Insert new blops
    const blopsToInsert = blops.map((blop: any) => ({
      user_id: userId,
      workspace_id: targetWorkspaceId,
      x: blop.x,
      y: blop.y,
      shape: blop.shape,
      color: blop.color,
      content: blop.content,
      type: blop.type,
      tags: blop.tags || null,
      connections: blop.connections || null,
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from('blops')
      .insert(blopsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting blops:', insertError)
      return NextResponse.json(
        { error: 'Failed to save blops', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      blops: data,
      message: `Saved ${data.length} blops` 
    })
  } catch (error: any) {
    console.error('Error in POST /api/blops:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

