# AI Coach Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Error: Internal server error"

This error usually means one of the following:

#### 1. Missing Environment Variables in Vercel

**Check if variables are set:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:
   - ✅ `GEMINI_API_KEY` - Your Gemini API key
   - ✅ `DATABASE_URL` - Your Supabase database connection string

**If missing, add them:**
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `DATABASE_URL`: `postgresql://postgres:GFymZWxctoA5XFtF@db.mbilegaqfscxjslcszhw.supabase.co:5432/postgres`

**After adding variables:**
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

#### 2. Check Vercel Function Logs

To see the actual error:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Deployments** tab
4. Click on your latest deployment
5. Click **"Functions"** tab
6. Click on `/api/ai/coach`
7. Check the **"Logs"** tab for error messages

Look for errors like:
- `GEMINI_API_KEY is missing` → Add the environment variable
- `Failed to generate SQL query` → Check Gemini API key validity
- `Failed to execute SQL query` → Check DATABASE_URL

#### 3. Test Environment Variables

You can test if your environment variables are set by checking the Vercel function logs. The improved error handling will now log:
- Whether `GEMINI_API_KEY` is set
- Whether `DATABASE_URL` is set
- The actual error message

### Issue: "Error: Gemini API key not configured"

**Solution:**
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to Vercel environment variables as `GEMINI_API_KEY`
3. Redeploy your application

### Issue: "Error: Failed to execute SQL query"

**Possible causes:**
1. `DATABASE_URL` is not set in Vercel
2. Database password is incorrect
3. Database connection is blocked

**Solution:**
1. Verify `DATABASE_URL` is set in Vercel
2. Check that the connection string format is correct
3. Verify your Supabase database is accessible

### Issue: "Error: Failed to generate SQL query" or "Failed to generate analysis"

**Possible causes:**
1. Invalid Gemini API key
2. Gemini API quota exceeded
3. Network issues

**Solution:**
1. Verify your Gemini API key is valid
2. Check your Google Cloud billing/quota
3. Try again after a few minutes

## Debugging Steps

1. **Check Vercel Logs** (most important!)
   - Go to Deployments → Latest → Functions → `/api/ai/coach` → Logs
   - Look for error messages

2. **Verify Environment Variables**
   - Settings → Environment Variables
   - Make sure all required variables are set

3. **Test Locally**
   - Make sure `.env.local` has all variables
   - Run `npm run dev`
   - Test the AI Coach locally

4. **Check Browser Console**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API responses

## Getting Help

If you're still having issues:

1. Check the Vercel function logs (most important!)
2. Share the error message from the logs
3. Verify all environment variables are set
4. Check that you've redeployed after adding variables

## Quick Checklist

- [ ] `GEMINI_API_KEY` is set in Vercel
- [ ] `DATABASE_URL` is set in Vercel
- [ ] All environment variables are set for Production, Preview, and Development
- [ ] You've redeployed after adding variables
- [ ] You've checked the Vercel function logs for actual errors



