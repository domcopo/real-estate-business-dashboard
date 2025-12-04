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
  let Pool: any
  try {
    const pgModule = await import('pg')
    Pool = pgModule.Pool
    if (!Pool) {
      throw new Error("pg.Pool is not available")
    }
  } catch (importError) {
    console.error("Failed to import pg library:", importError)
    throw new Error(`Failed to import PostgreSQL client library: ${importError instanceof Error ? importError.message : String(importError)}`)
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false, // Supabase requires SSL
    },
    max: 1, // Limit connections for serverless
  })

  try {
    const result = await pool.query(sql)
    return result.rows
  } catch (error) {
    console.error("Error executing SQL query:", error)
    console.error("SQL query was:", sql.substring(0, 200)) // Log first 200 chars
    throw new Error(`Failed to execute SQL query: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    await pool.end()
  }
}

