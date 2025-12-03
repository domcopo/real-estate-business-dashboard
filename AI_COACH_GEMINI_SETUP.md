# AI Coach with Gemini & Database Integration Setup

This guide will help you set up the AI Coach feature that uses Google Gemini to generate SQL queries and analyze your Supabase database.

## Overview

The AI Coach now has the ability to:
1. **Understand your questions** in natural language
2. **Generate SQL queries** based on your database schema
3. **Execute queries** against your Supabase database
4. **Analyze results** and provide actionable business insights

## Prerequisites

- Supabase project set up
- Google Gemini API key
- Node.js project dependencies installed

## Step 1: Install Dependencies

Run the following command to install the required packages:

```bash
npm install
```

This will install:
- `@google/generative-ai` - Google Gemini AI SDK
- `pg` - PostgreSQL client for direct database queries
- `@types/pg` - TypeScript types for pg

## Step 2: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

## Step 3: Get Your Supabase Database Connection String

**Step-by-Step Instructions:**

1. In the **left sidebar**, look for the "Database Features" section
2. Click on **"Database"** (it has a database icon next to it)
3. Once you're on the Database page, look for **"Connection String"** or **"Connection Info"** section
4. You'll see different connection string formats - click the **"URI"** tab (not "Session mode" or "Transaction mode")
5. Copy the connection string (it looks like: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)
6. **Important**: Replace `[PASSWORD]` with your actual database password **WITHOUT the brackets**
   - Example: If your password is `mypassword123`, replace `[PASSWORD]` with `mypassword123` (no brackets)
   - Your database password is shown in the same Database page (you may need to click "Show" or "Reveal" to see it)
   - If your password contains special characters (like `@`, `#`, `%`, etc.), you may need to URL-encode them
   - If you don't know your password, you can reset it in the Database settings page

**Example:**
- Connection string template: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
- After replacing: `postgresql://postgres:mypassword123@db.xxxxx.supabase.co:5432/postgres`
  - Notice: No brackets around the password!

**Method 2: Construct it manually**

If you can't find the connection string section, you can construct it:

1. Go to **Settings** → **Database**
2. Find your **Database Host** (looks like `db.xxxxx.supabase.co`)
3. Find or set your **Database Password**
4. Construct the connection string: `postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres`
   - Replace `[YOUR_PASSWORD]` with your database password
   - Replace `[YOUR_HOST]` with your database host

**Still can't find it?**
- Look for "Connection Pooling" or "Connection Info" sections
- Check if you're in the correct project
- The connection string might be under "Project Settings" → "Database" instead

## Step 4: Configure Environment Variables

Create a `.env.local` file in the root of your project (or update your existing `.env` file) with the following variables:

```env
# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Connection String (REQUIRED for AI Coach)
# Replace [YOUR_PASSWORD] and [YOUR_HOST] with actual values (remove the brackets!)
# Example: DATABASE_URL=postgresql://postgres:mypassword123@db.xxxxx.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres

# Gemini API Key (REQUIRED for AI Coach)
GEMINI_API_KEY=your_gemini_api_key
```

**Important Notes:**
- Replace `[YOUR_PASSWORD]` with your actual Supabase database password **WITHOUT the brackets**
- Replace `[YOUR_HOST]` with your Supabase database host (usually something like `db.xxxxx.supabase.co`) **WITHOUT the brackets**
- Example: If your password is `abc123` and host is `db.xyz.supabase.co`, your DATABASE_URL should be:
  ```
  DATABASE_URL=postgresql://postgres:abc123@db.xyz.supabase.co:5432/postgres
  ```
- Never commit `.env.local` to git (it should be in `.gitignore`)

## Step 5: Update Vercel Environment Variables (if deploying)

If you're deploying to Vercel, add these environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `GEMINI_API_KEY` = your Gemini API key
   - `DATABASE_URL` = your Supabase database connection string

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the AI Coach page in your app
3. Try asking questions like:
   - "How many properties do I have?"
   - "What's my total monthly subscription cost?"
   - "Show me my top performing clients"
   - "What's my total property portfolio value?"

## How It Works

### Flow Diagram

```
User Question
    ↓
Gemini generates SQL query
    ↓
Execute SQL via PostgreSQL
    ↓
Get query results
    ↓
Gemini analyzes results
    ↓
Return insights to user
```

### Security Features

- **User Isolation**: All queries automatically filter by `user_id` to ensure users only see their own data
- **Read-Only**: The AI Coach only generates SELECT queries (no INSERT, UPDATE, DELETE)
- **Server-Side Only**: Database queries execute server-side, never exposing credentials to the client

## Troubleshooting

### Error: "DATABASE_URL not configured"

**Solution**: Make sure you've added the `DATABASE_URL` environment variable with your Supabase database connection string.

### Error: "Gemini API key not configured"

**Solution**: Make sure you've added the `GEMINI_API_KEY` environment variable.

### Error: "Failed to execute SQL query"

**Possible causes:**
1. Invalid database connection string
2. Database password is incorrect
3. Network/firewall issues
4. SQL query syntax error (check the debug output in development mode)

**Solution**: 
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- In development mode, check the console for the generated SQL query

### SQL queries are slow

**Solution**: 
- The AI may generate complex queries. Consider adding database indexes for frequently queried columns
- Limit the scope of your questions (e.g., "last 30 days" instead of "all time")

## Example Questions

Here are some example questions you can ask the AI Coach:

**Properties:**
- "What's the total value of my property portfolio?"
- "How many properties are currently rented vs vacant?"
- "What's my average monthly cash flow from properties?"

**Subscriptions:**
- "What's my total monthly subscription cost?"
- "Which subscriptions are renewing this month?"
- "What's my annual subscription spend?"

**Clients:**
- "How many active clients do I have?"
- "Which clients have the most leads this week?"
- "Show me my top 5 clients by revenue"

**General:**
- "Give me a summary of my business performance"
- "What should I focus on this week?"
- "Analyze my business metrics and suggest improvements"

## Advanced Configuration

### Customizing the System Prompt

Edit `lib/ai-coach/system-prompt.ts` to customize the AI Coach's personality and response style.

### Adjusting SQL Generation

Edit the SQL generation prompt in `app/api/ai/coach/route.ts` to change how Gemini generates queries.

### Database Schema Updates

If you add new tables or columns, update `lib/database-schema.ts` to include them in the schema context.

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure your Supabase project is active and accessible

