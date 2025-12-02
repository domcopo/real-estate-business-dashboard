# Supabase Database Setup Guide

This guide will help you set up your Supabase database for the Unified Workspace application.

## Prerequisites

1. A Supabase account ([sign up here](https://supabase.com))
2. A Supabase project created
3. Your Supabase project URL and API keys

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Your project name (e.g., "unified-workspace")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (takes 1-2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important**: 
- The `NEXT_PUBLIC_` prefix makes these available in the browser
- Never commit `.env.local` to git (it should be in `.gitignore`)
- The service_role key should only be used server-side

## Step 4: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents of `schema.sql`
5. Paste it into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" if everything worked

## Step 5: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor**
2. You should see the following tables:
   - `blops`
   - `websites`
   - `subscriptions`
   - `properties`
   - `rent_roll_units`
   - `work_requests`
   - `agency_clients`
   - `ghl_clients`
   - `ghl_weekly_metrics`

## Step 6: Configure Row Level Security (RLS)

The schema includes basic RLS policies, but since you're using Clerk for authentication (not Supabase Auth), you'll need to adjust the policies.

### Option A: Use Service Role Key (Server-Side Only)

For server-side operations, use the service_role key which bypasses RLS. This is the recommended approach when using Clerk.

Update your Supabase client creation in `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

// Client-side client (uses anon key, respects RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client (uses service_role key, bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Option B: Update RLS Policies for Clerk

If you want to use RLS with Clerk, you'll need to:

1. Create a function that validates Clerk user_id
2. Update RLS policies to use this function
3. Pass Clerk user_id in your queries

Example policy update:

```sql
-- Create a function to check if user_id matches
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'user_id';
$$ LANGUAGE sql STABLE;

-- Update policy example
CREATE POLICY "Users can view their own blops"
  ON blops FOR SELECT
  USING (user_id = auth.user_id());
```

However, this requires additional setup with Clerk webhooks or JWT configuration.

## Step 7: Test the Connection

Create a test API route to verify everything works:

```typescript
// app/api/test-db/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('blops')
      .select('*')
      .limit(1)
    
    if (error) throw error
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
```

Visit `http://localhost:3000/api/test-db` to test.

## Database Schema Overview

### Core Tables

- **blops**: Flexboard items (draggable elements)
- **websites**: Tracked websites and their tech stacks
- **subscriptions**: Subscription services and renewals
- **properties**: Real estate properties with financial data
- **rent_roll_units**: Rental units within properties
- **work_requests**: Maintenance requests for properties
- **agency_clients**: Agency/client management
- **ghl_clients**: GoHighLevel integration clients
- **ghl_weekly_metrics**: Weekly metrics for GHL clients

### Key Features

- **UUID primary keys**: All tables use UUIDs for IDs
- **User isolation**: All tables include `user_id` for multi-tenancy
- **Workspace support**: Optional `workspace_id` for organization support
- **Automatic timestamps**: `created_at` and `updated_at` are automatically managed
- **Indexes**: Optimized for common query patterns
- **Foreign keys**: Proper relationships between tables
- **Row Level Security**: Basic RLS policies (adjust for Clerk)

## Next Steps

1. **Update API Routes**: Modify your API routes to use Supabase instead of mock data
2. **Add Data Validation**: Consider adding Zod schemas for data validation
3. **Set Up Migrations**: Use Supabase migrations for version control
4. **Configure Backups**: Set up automatic backups in Supabase dashboard
5. **Monitor Performance**: Use Supabase dashboard to monitor query performance

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the schema.sql file completely
- Check that you're connected to the correct Supabase project

### RLS policy errors
- Verify your RLS policies match your authentication setup
- Consider using service_role key for server-side operations

### Connection errors
- Verify your environment variables are set correctly
- Check that your Supabase project is active
- Ensure your IP is not blocked (check Supabase dashboard)

### Type errors
- Update your TypeScript types to match the database schema
- Consider using Supabase's TypeScript generator: `npx supabase gen types typescript --project-id your-project-id > types/supabase.ts`

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase TypeScript Types](https://supabase.com/docs/guides/api/generating-types)

