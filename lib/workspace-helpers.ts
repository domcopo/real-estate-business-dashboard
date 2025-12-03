/**
 * Workspace Helper Functions
 * 
 * Utility functions for workspace and team management
 */

import { supabaseAdmin } from './supabase'

export interface Workspace {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface Invitation {
  id: string
  workspace_id: string
  email: string
  invited_by: string
  role: 'admin' | 'member'
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
  accepted_at: string | null
}

/**
 * Get or create a default workspace for a user
 * If user doesn't have a workspace, creates one named "My Workspace"
 */
export async function getOrCreateUserWorkspace(userId: string): Promise<Workspace> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }

  // First, check if user is a member of any workspace
  const { data: memberData, error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (memberData && !memberError) {
    // User is a member, get the workspace
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .select('*')
      .eq('id', memberData.workspace_id)
      .maybeSingle()

    if (workspace && !error) {
      return workspace as Workspace
    }
  }

  // Check if user owns any workspace
  const { data: ownedWorkspace, error: ownedError } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle()

  if (ownedWorkspace && !ownedError) {
    return ownedWorkspace as Workspace
  }

  // User has no workspace, create one
  const { data: newWorkspace, error: createError } = await supabaseAdmin
    .from('workspaces')
    .insert({
      name: 'My Workspace',
      owner_id: userId,
    })
    .select()
    .single()

  if (createError || !newWorkspace) {
    console.error('Error creating workspace:', createError)
    throw new Error(`Failed to create workspace: ${createError?.message || 'Unknown error'}`)
  }

  // Add user as owner member
  const { error: memberInsertError } = await supabaseAdmin
    .from('workspace_members')
    .insert({
      workspace_id: newWorkspace.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberInsertError) {
    console.error('Error adding user as workspace member:', memberInsertError)
    // Don't fail - workspace was created, member can be added later
  }

  return newWorkspace as Workspace
}

/**
 * Get all workspaces a user has access to
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }

  // Get workspaces user owns
  const { data: owned, error: ownedError } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .eq('owner_id', userId)

  // Get workspaces user is a member of
  const { data: memberships, error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)

  if (memberError) {
    console.error('Error fetching memberships:', memberError)
  }

  const workspaceIds = memberships?.map(m => m.workspace_id) || []
  
  const { data: memberWorkspaces, error: memberWorkspacesError } = await supabaseAdmin
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds)

  if (memberWorkspacesError) {
    console.error('Error fetching member workspaces:', memberWorkspacesError)
  }

  // Combine and deduplicate
  const allWorkspaces = [
    ...(owned || []),
    ...(memberWorkspaces || []),
  ]

  // Deduplicate by id
  const uniqueWorkspaces = Array.from(
    new Map(allWorkspaces.map(w => [w.id, w])).values()
  )

  return uniqueWorkspaces as Workspace[]
}

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }

  const { data, error } = await supabaseAdmin
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch workspace members: ${error.message}`)
  }

  return (data || []) as WorkspaceMember[]
}

/**
 * Check if user has access to a workspace
 */
export async function userHasWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }

  // Check if user owns the workspace
  const { data: owned, error: ownedError } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .single()

  if (owned && !ownedError) {
    return true
  }

  // Check if user is a member
  const { data: member, error: memberError } = await supabaseAdmin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  return !!(member && !memberError)
}

/**
 * Get user's role in a workspace
 */
export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<'owner' | 'admin' | 'member' | null> {
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured')
  }

  // Check if user owns the workspace
  const { data: owned } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .single()

  if (owned) {
    return 'owner'
  }

  // Check membership
  const { data: member } = await supabaseAdmin
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  return (member?.role as 'admin' | 'member') || null
}


