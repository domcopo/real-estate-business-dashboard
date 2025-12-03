# Vercel Environment Variables Setup

To test your Supabase database on your live Vercel deployment, you need to add environment variables.

## Step 1: Add Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://mbilegaqfscxjslcszhw.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWxlZ2FxZnNjeGpzbGNzemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjE1MzgsImV4cCI6MjA4MDEzNzUzOH0.RZvS-0twolNBa2c_euKs6drM4MlKw56dZI4tG9GMFHE
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWxlZ2FxZnNjeGpzbGNzemh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU2MTUzOCwiZXhwIjoyMDgwMTM3NTM4fQ.qcBQ58eciFokv5uDdky4vaRlZ5kY9R_j-9dLFMazrLQ
```

### Important Notes:

- **Environment**: Select **Production**, **Preview**, and **Development** (or at least Production)
- Make sure there are **no spaces** or **quotes** around the values
- The `NEXT_PUBLIC_` prefix makes variables available in the browser

## Step 2: Redeploy Your Application

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a new deployment

## Step 3: Test the Database Connection

Once redeployed, visit:
```
https://your-app.vercel.app/api/test-db
```

Replace `your-app` with your actual Vercel domain.

You should see a JSON response indicating:
- ✅ Connection status
- ✅ Table existence
- ✅ Configuration details

## Troubleshooting

### Environment variables not working?
- Make sure you selected the right environments (Production, Preview, Development)
- Redeploy after adding variables
- Check that variable names match exactly (case-sensitive)

### Still getting errors?
- Check Vercel deployment logs for errors
- Verify the Supabase URL and keys are correct
- Make sure your database schema was run successfully







