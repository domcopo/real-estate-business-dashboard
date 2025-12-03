# Multi-User Teamwork Setup Guide

This guide will help you set up multi-user workspace functionality, allowing you to invite team members and share access to your entire database.

## Database Setup

### Step 1: Run the Workspace Schema Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/workspaces-schema.sql`
3. Click "Run" to execute the SQL

This will create:
- `workspaces` table - Stores workspace information
- `workspace_members` table - Tracks which users belong to which workspaces
- `invitations` table - Manages pending invitations
- Row Level Security (RLS) policies for secure access
- Helper functions for workspace management

### Step 2: Verify Tables Created

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('workspaces', 'workspace_members', 'invitations');
```

## How It Works

### Workspace Creation
- When a user first accesses the app, a default workspace named "My Workspace" is automatically created
- Users can create additional workspaces if needed

### Data Sharing
- All data (properties, websites, subscriptions, blops) is now scoped to workspaces
- Users who are members of the same workspace can see and edit the same data
- Data is filtered by `workspace_id` instead of just `user_id`

### Roles
- **Owner**: Can manage workspace settings, invite/remove members, and delete the workspace
- **Admin**: Can invite/remove members and manage invitations
- **Member**: Can view and edit workspace data

## Features

### Team Management
- **Invite Members**: Send email invitations to join your workspace
- **View Members**: See all team members and their roles
- **Remove Members**: Remove team members (owners and admins only)
- **Manage Invitations**: View and cancel pending invitations

### Access Control
- All API routes now check workspace membership before allowing access
- Users can only see data from workspaces they belong to
- Automatic workspace creation ensures users always have access

## Usage

### Accessing Team Management

1. Navigate to **Settings** in the dashboard
2. Click on the **Team** tab
3. You'll see:
   - Invite form to add new members
   - List of current team members
   - Pending invitations

### Inviting a Team Member

1. Enter the email address of the person you want to invite
2. Select their role (Member or Admin)
3. Click "Invite"
4. The invitation will be created with a unique token
5. Share the invitation link with the person (currently shown in the response - in production, this would be sent via email)

### Accepting an Invitation

Currently, invitations are created but acceptance needs to be implemented. The invitation token can be used to create an acceptance flow.

## API Endpoints

### Workspace
- `GET /api/workspace` - Get current workspace
- `POST /api/workspace` - Create new workspace

### Members
- `GET /api/workspace/members?workspaceId=<id>` - Get workspace members
- `DELETE /api/workspace/members?workspaceId=<id>&userId=<id>` - Remove member

### Invitations
- `GET /api/workspace/invitations?workspaceId=<id>` - Get pending invitations
- `POST /api/workspace/invitations` - Create invitation
- `DELETE /api/workspace/invitations?invitationId=<id>` - Cancel invitation

## Next Steps

### To Complete the Implementation:

1. **Email Integration**: Set up email sending for invitations (using SendGrid, Resend, or similar)
2. **Invitation Acceptance**: Create a page at `/invite/[token]` to accept invitations
3. **User Lookup**: Implement email-to-user lookup in Clerk to properly match invitations
4. **Workspace Switching**: Add UI to switch between multiple workspaces
5. **Activity Logging**: Track who made what changes in the workspace

## Troubleshooting

### "You do not have access to this workspace"
- Make sure you're a member of the workspace
- Check that the workspace was created correctly
- Verify RLS policies are set up correctly

### "Failed to create workspace"
- Check Supabase connection
- Verify environment variables are set
- Check Supabase logs for errors

### Invitations not showing
- Check that invitations were created successfully
- Verify the workspace ID is correct
- Check that you have admin/owner role

## Security Notes

- All data access is filtered by workspace membership
- RLS policies ensure users can only access data from workspaces they belong to
- Invitation tokens are cryptographically secure (32-byte random hex)
- Invitations expire after 7 days by default


