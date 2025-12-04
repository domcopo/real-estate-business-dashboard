# Quick Supabase Setup Guide

Your Supabase project URL: `https://mbilegaqfscxjslcszhw.supabase.co`

## Step 1: Get Your API Keys

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/mbilegaqfscxjslcszhw
2. Navigate to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://mbilegaqfscxjslcszhw.supabase.co` (you already have this!)
   - **anon/public key**: Copy the `anon` `public` key (starts with `eyJ...`)
   - **service_role key**: Copy the `service_role` `secret` key (starts with `eyJ...`) - Keep this secret!

## Step 2: Create `.env.local` File

Create a `.env.local` file in your project root with:

```env
# Your existing Clerk keys (if you have them)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mbilegaqfscxjslcszhw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste-your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=paste-your-service-role-key-here
```

## Step 3: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 4: Verify Setup

1. Make sure your dev server is running: `npm run dev`
2. Visit: http://localhost:3000/api/test-db
3. You should see a JSON response with connection status

## Troubleshooting

### "relation does not exist" error
- This means the tables haven't been created yet
- Go back to Step 3 and run the schema.sql file

### "Invalid API key" error
- Double-check that you copied the keys correctly
- Make sure there are no extra spaces or quotes
- Restart your dev server after adding environment variables

### Environment variables not loading
- Make sure the file is named `.env.local` (not `.env` or `.env.example`)
- Restart your Next.js dev server
- Check that the file is in the project root (same directory as `package.json`)

## Next Steps

Once everything is working:
- Check out `DATABASE_SETUP.md` for detailed documentation
- Use the helper functions in `lib/db-helpers.ts` in your API routes
- See examples in the database setup guide














