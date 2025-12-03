import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getWorkspaceMembers, getUserWorkspaceRole, userHasWorkspaceAccess } from '@/lib/workspace-helpers'

/**
 * GET /api/workspace/members - Get workspace members
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

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    // Check if user has access to this workspace
    const hasAccess = await userHasWorkspaceAccess(userId, workspaceId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    const members = await getWorkspaceMembers(workspaceId)

    return NextResponse.json({ members })
  } catch (error: any) {
    console.error('Error in GET /api/workspace/members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspace/members - Remove a member from workspace
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const memberUserId = searchParams.get('userId')

    if (!workspaceId || !memberUserId) {
      return NextResponse.json(
        { error: 'workspaceId and userId are required' },
        { status: 400 }
      )
    }

    // Check if requester has admin/owner role
    const requesterRole = await getUserWorkspaceRole(userId, workspaceId)
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to remove members' },
        { status: 403 }
      )
    }

    // Cannot remove the owner
    const memberRole = await getUserWorkspaceRole(memberUserId, workspaceId)
    if (memberRole === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      )
    }

    // Cannot remove yourself if you're an admin (only owner can remove themselves)
    if (memberUserId === userId && requesterRole !== 'owner') {
      return NextResponse.json(
        { error: 'You cannot remove yourself' },
        { status: 400 }
      )
    }

    // Remove member
    const { error: deleteError } = await supabaseAdmin
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', memberUserId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove member', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Member removed successfully' 
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/workspace/members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


