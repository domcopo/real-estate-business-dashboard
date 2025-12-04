# Vercel Environment Variables for Supabase

## Step-by-Step Guide

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add These Variables

Click **"Add Another"** for each variable below:

**Required for Supabase:**

---

#### Variable 1: Supabase URL
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://mbilegaqfscxjslcszhw.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

#### Variable 2: Supabase Anon Key (Public)
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWxlZ2FxZnNjeGpzbGNzemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjE1MzgsImV4cCI6MjA4MDEzNzUzOH0.RZvS-0twolNBa2c_euKs6drM4MlKw56dZI4tG9GMFHE`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

⚠️ **Note**: Vercel will warn you that this key is public. This is expected - the anon key is safe to expose in the browser.

---

#### Variable 3: Supabase Service Role Key (Secret)
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWxlZ2FxZnNjeGpzbGNzemh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2MTUzOCwiZXhwIjoyMDgwMTM3NTM4fQ.qcBQ58eciFokv5uDdky4vaRlZ5kY9R_j-9dLFMazrLQ`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

🔒 **Important**: This key is secret and should NEVER be exposed to the browser. It's only used server-side.

---

#### Variable 4: Database Connection String (for AI Coach)
- **Key**: `DATABASE_URL`
- **Value**: `postgresql://postgres:GFymZWxctoA5XFtF@db.mbilegaqfscxjslcszhw.supabase.co:5432/postgres`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

🔒 **Important**: This contains your database password. Keep it secret!

---

#### Variable 5: Gemini API Key (for AI Coach)
- **Key**: `GEMINI_API_KEY`
- **Value**: Your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**How to get it:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and paste it here

---

### Step 3: Verify All Variables Are Added

You should see all 5 variables listed:
1. ✅ `NEXT_PUBLIC_SUPABASE_URL`
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ✅ `SUPABASE_SERVICE_ROLE_KEY`
4. ✅ `DATABASE_URL` (for AI Coach)
5. ✅ `GEMINI_API_KEY` (for AI Coach)

### Step 4: Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Click **"..."** on your latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 5: Test

Visit: `https://your-app.vercel.app/api/test-db`

You should see a JSON response confirming the database connection!

---

## Quick Copy-Paste Values

If you need to copy them quickly:

**URL:**
```
https://mbilegaqfscxjslcszhw.supabase.co
```

**Anon Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWxlZ2FxZnNjeGpzbGNzemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjE1MzgsImV4cCI6MjA4MDEzNzUzOH0.RZvS-0twolNBa2c_euKs6drM4MlKw56dZI4tG9GMFHE
```

**Service Role Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWxlZ2FxZnNjeGpzbGNzemh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2MTUzOCwiZXhwIjoyMDgwMTM3NTM4fQ.qcBQ58eciFokv5uDdky4vaRlZ5kY9R_j-9dLFMazrLQ
```












