import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserWorkspaceRole, userHasWorkspaceAccess } from '@/lib/workspace-helpers'
import { randomBytes } from 'crypto'

/**
 * GET /api/workspace/invitations - Get workspace invitations
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

    // Check if user has admin/owner role
    const role = await getUserWorkspaceRole(userId, workspaceId)
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations' },
        { status: 403 }
      )
    }

    const { data: invitations, error } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ invitations: invitations || [] })
  } catch (error: any) {
    console.error('Error in GET /api/workspace/invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/workspace/invitations - Create a new invitation
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
    const { workspaceId, email, role = 'member' } = body

    if (!workspaceId || !email) {
      return NextResponse.json(
        { error: 'workspaceId and email are required' },
        { status: 400 }
      )
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json(
        { error: 'Role must be "admin" or "member"' },
        { status: 400 }
      )
    }

    // Check if user has admin/owner role
    const requesterRole = await getUserWorkspaceRole(userId, workspaceId)
    if (requesterRole !== 'owner' && requesterRole !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', email) // This is a simplified check - in production, you'd look up by email in Clerk
      .single()

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')

    // Create invitation
    const { data: invitation, error: createError } = await supabaseAdmin
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        invited_by: userId,
        role: role as 'admin' | 'member',
        token,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (createError || !invitation) {
      console.error('Error creating invitation:', createError)
      return NextResponse.json(
        { error: 'Failed to create invitation', details: createError?.message },
        { status: 500 }
      )
    }

    // TODO: Send invitation email here
    // For now, return the invitation with token (in production, don't expose token)

    return NextResponse.json({ 
      success: true,
      invitation: {
        ...invitation,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
      }
    })
  } catch (error: any) {
    console.error('Error in POST /api/workspace/invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/workspace/invitations - Cancel an invitation
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
    const invitationId = searchParams.get('invitationId')

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitationId is required' },
        { status: 400 }
      )
    }

    // Get invitation to check workspace
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('invitations')
      .select('workspace_id')
      .eq('id', invitationId)
      .single()

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user has admin/owner role
    const role = await getUserWorkspaceRole(userId, invitation.workspace_id)
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to cancel invitations' },
        { status: 403 }
      )
    }

    // Delete invitation
    const { error: deleteError } = await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel invitation', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation cancelled successfully' 
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/workspace/invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


