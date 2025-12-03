/**
 * Database query utilities for executing raw SQL queries via Supabase PostgreSQL
 * Uses direct PostgreSQL connection for executing AI-generated SQL queries
 */

/**
 * Execute a raw SQL query against Supabase PostgreSQL database
 * 
 * @param sql - The SQL query string to execute
 * @returns Array of result rows, or empty array if no results
 * @throws Error if query execution fails
 */
export async function runSupabaseQuery(sql: string): Promise<any[]> {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL or SUPABASE_DB_URL environment variable is required for raw SQL queries. " +
      "You can find this in your Supabase project settings under Database > Connection String. " +
      "Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
    )
  }

  // Use pg library for direct PostgreSQL connection
  const { Pool } = await import('pg')

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false, // Supabase requires SSL
    },
  })

  try {
    const result = await pool.query(sql)
    return result.rows
  } catch (error) {
    console.error("Error executing SQL query:", error)
    throw new Error(`Failed to execute SQL query: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    await pool.end()
  }
}

