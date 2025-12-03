import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getOrCreateUserWorkspace, getUserWorkspaces } from '@/lib/workspace-helpers'

/**
 * GET /api/workspace - Get user's current workspace
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

    const workspace = await getOrCreateUserWorkspace(userId)
    const workspaces = await getUserWorkspaces(userId)

    return NextResponse.json({ 
      workspace,
      workspaces 
    })
  } catch (error: any) {
    console.error('Error in GET /api/workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workspace - Create a new workspace
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
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      )
    }

    // Create workspace
    const { data: workspace, error: createError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name: name.trim(),
        owner_id: userId,
      })
      .select()
      .single()

    if (createError || !workspace) {
      console.error('Error creating workspace:', createError)
      return NextResponse.json(
        { error: 'Failed to create workspace', details: createError?.message },
        { status: 500 }
      )
    }

    // Add user as owner member
    await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: userId,
        role: 'owner',
      })

    return NextResponse.json({ 
      success: true,
      workspace 
    })
  } catch (error: any) {
    console.error('Error in POST /api/workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


