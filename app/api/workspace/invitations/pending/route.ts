import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/workspace/invitations/pending - Get pending invitations for the current user
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

    // Get user's email from Clerk
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()
    if (!userEmail) {
      return NextResponse.json(
        { invitations: [] },
        { status: 200 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get pending invitations for this email
    const { data: invitations, error } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('email', userEmail)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Fetch workspace names for each invitation
    if (invitations && invitations.length > 0) {
      const workspaceIds = Array.from(new Set(invitations.map(inv => inv.workspace_id)))
      const { data: workspaces } = await supabaseAdmin
        .from('workspaces')
        .select('id, name')
        .in('id', workspaceIds)

      // Attach workspace info to invitations
      const workspaceMap = new Map(workspaces?.map(w => [w.id, w]) || [])
      invitations.forEach(inv => {
        inv.workspaces = workspaceMap.get(inv.workspace_id) || null
      })
    }

    if (error) {
      console.error('Error fetching pending invitations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations', details: error.message },
        { status: 500 }
      )
    }

    // Filter out expired invitations
    const validInvitations = (invitations || []).filter(
      inv => new Date(inv.expires_at) > new Date()
    )

    return NextResponse.json({ invitations: validInvitations })
  } catch (error: any) {
    console.error('Error in GET /api/workspace/invitations/pending:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

