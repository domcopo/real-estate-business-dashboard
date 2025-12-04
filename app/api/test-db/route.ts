import { supabase, supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * Test API route to verify Supabase connection
 * Visit: http://localhost:3000/api/test-db
 */
export async function GET() {
  try {
    // Test basic connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    const config = {
      url: supabaseUrl || 'Not configured',
      hasAnonKey,
      hasServiceKey,
    }

    // Test connection with a simple query
    let connectionTest = null
    let error = null

    if (supabaseUrl && hasAnonKey) {
      try {
        // Try to query a table (this will fail if tables don't exist, but connection will work)
        const { data, error: queryError } = await supabase
          .from('blops')
          .select('id')
          .limit(1)

        if (queryError) {
          // If it's a "relation does not exist" error, connection is working but tables aren't set up
          if (queryError.code === '42P01') {
            connectionTest = {
              status: 'connected',
              message: 'Database connected but tables not found. Please run the schema.sql file.',
              error: queryError.message,
            }
          } else {
            connectionTest = {
              status: 'error',
              message: 'Connection error',
              error: queryError.message,
            }
          }
        } else {
          connectionTest = {
            status: 'success',
            message: 'Database connected and tables exist!',
            data,
          }
        }
      } catch (err: any) {
        error = err.message
        connectionTest = {
          status: 'error',
          message: 'Failed to connect',
          error: err.message,
        }
      }
    } else {
      connectionTest = {
        status: 'not_configured',
        message: 'Supabase environment variables not set',
      }
    }

    return NextResponse.json({
      success: true,
      config,
      connectionTest,
      nextSteps: {
        ifNotConfigured: [
          '1. Add NEXT_PUBLIC_SUPABASE_URL to .env.local',
          '2. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
          '3. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (optional, for server-side operations)',
        ],
        ifTablesMissing: [
          '1. Go to your Supabase dashboard',
          '2. Open SQL Editor',
          '3. Copy and paste the contents of supabase/schema.sql',
          '4. Run the query',
        ],
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}














