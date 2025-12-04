# Step-by-Step Guide: Setting Up Workspace Tables in Supabase

Follow these steps to create the workspace tables needed for team management.

## Step 1: Open Your Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Click on your project (the one you're using for this app)

## Step 2: Open the SQL Editor

1. In the left sidebar, click on **"SQL Editor"** (it has a database icon)
2. Click the **"New query"** button (top right, or use the "+" icon)

## Step 3: Copy the Workspace Schema

1. Open the file `supabase/workspaces-schema.sql` in your project
2. **Select ALL** the contents (Cmd+A on Mac, Ctrl+A on Windows)
3. **Copy** it (Cmd+C on Mac, Ctrl+C on Windows)

## Step 4: Paste and Run the SQL

1. Go back to your Supabase SQL Editor
2. **Paste** the SQL you copied (Cmd+V on Mac, Ctrl+V on Windows)
3. Click the **"Run"** button (bottom right, or press Cmd+Enter / Ctrl+Enter)
4. Wait for it to complete - you should see "Success. No rows returned" or similar

## Step 5: Verify Tables Were Created

Run this verification query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('workspaces', 'workspace_members', 'invitations')
ORDER BY table_name;
```

You should see all three tables listed:
- `invitations`
- `workspace_members`
- `workspaces`

## Step 6: Refresh Your App

1. Go back to your app (Settings → Team tab)
2. **Refresh the page** (F5 or Cmd+R / Ctrl+R)
3. The workspace should now load automatically, or you can click "Create Workspace"

## Troubleshooting

### If you get an error about "function update_updated_at_column does not exist":
This means you need to create that function first. Run this SQL before running the workspace schema:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### If you get permission errors:
Make sure you're logged in as the project owner or have admin access.

### If tables still don't appear:
1. Check that you're in the correct project
2. Make sure you ran the SQL in the SQL Editor (not just copied it)
3. Try refreshing the Supabase dashboard

## What This Creates

- **workspaces** - Stores workspace information
- **workspace_members** - Tracks team members and their roles
- **invitations** - Manages pending invitations
- Indexes for performance
- Security policies (RLS) for data protection

Once this is done, you'll be able to:
- Create workspaces
- Invite team members
- Manage your team
- Share data with teammates








