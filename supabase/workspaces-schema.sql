-- ============================================
-- WORKSPACES & TEAM MANAGEMENT SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor to add workspace/team functionality

-- ============================================
-- WORKSPACES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL, -- Clerk user ID of the workspace owner
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- WORKSPACE MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================
-- INVITATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by TEXT NOT NULL, -- Clerk user ID of the person who sent the invitation
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  token TEXT NOT NULL UNIQUE, -- Unique token for accepting the invitation
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_id ON invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Workspaces policies: Users can view workspaces they own or are members of
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    owner_id = current_setting('app.user_id', true) OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = current_setting('app.user_id', true)
    )
  );

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = current_setting('app.user_id', true));

CREATE POLICY "Owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id = current_setting('app.user_id', true));

CREATE POLICY "Owners can delete their workspaces"
  ON workspaces FOR DELETE
  USING (owner_id = current_setting('app.user_id', true));

-- Workspace members policies: Users can view members of workspaces they belong to
CREATE POLICY "Users can view members of their workspaces"
  ON workspace_members FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true) OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Invitations policies: Users can view invitations for workspaces they manage
CREATE POLICY "Users can view invitations for their workspaces"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete invitations"
  ON invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = invitations.workspace_id
      AND wm.user_id = current_setting('app.user_id', true)
      AND wm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TIMESTAMP
-- ============================================
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Get user's workspace IDs
-- ============================================
CREATE OR REPLACE FUNCTION get_user_workspace_ids(p_user_id TEXT)
RETURNS TABLE(workspace_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT w.id
  FROM workspaces w
  WHERE w.owner_id = p_user_id
  UNION
  SELECT wm.workspace_id
  FROM workspace_members wm
  WHERE wm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user has access to workspace
-- ============================================
CREATE OR REPLACE FUNCTION user_has_workspace_access(p_user_id TEXT, p_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = p_workspace_id
    AND w.owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
    AND wm.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

