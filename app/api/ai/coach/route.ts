import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { runSupabaseQuery } from "@/lib/database"
import { getDatabaseSchema } from "@/lib/database-schema"
import { AI_COACH_SYSTEM_PROMPT } from "@/lib/ai-coach/system-prompt"

/**
 * POST /api/ai/coach
 * 
 * Protected API route for AI Coach chat with database query capabilities
 * Requires authentication via Clerk
 * 
 * Flow:
 * 1. User asks a question
 * 2. Gemini generates SQL query based on question and schema
 * 3. Execute SQL via Supabase
 * 4. Gemini analyzes results and provides insights
 * 
 * Body:
 * - message: string - User's question or message
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check for Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is missing from environment variables")
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GEMINI_API_KEY in your Vercel environment variables." },
        { status: 500 }
      )
    }

    // Check for database URL (optional but recommended)
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
    if (!databaseUrl) {
      console.warn("DATABASE_URL is missing - AI Coach will work but won't be able to query the database")
    }

    // Parse request body
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    
    // Try to fetch available models first using REST API
    let availableModel: string | null = null
    try {
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`)
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json()
        const models = modelsData.models || []
        // Find a model that supports generateContent
        const generateContentModel = models.find((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent') || 
          m.supportedGenerationMethods?.includes('GENERATE_CONTENT')
        )
        if (generateContentModel) {
          availableModel = generateContentModel.name.replace('models/', '')
          console.log(`Found available model: ${availableModel}`)
        }
      }
    } catch (listError) {
      console.warn("Could not list models, will try default:", listError)
    }
    
    // Use available model or fallback to common names
    const modelName = availableModel || "gemini-pro"
    const model = genAI.getGenerativeModel({ model: modelName })
    console.log(`Using Gemini model: ${modelName}`)

    // Get database schema for context
    const dbSchema = getDatabaseSchema()

    // Step 1: Generate SQL query from user question
    const sqlGenerationPrompt = `You are a PostgreSQL/Supabase SQL expert. Generate a SQL query to answer the user's question.

Database Schema:
${dbSchema}

User Question: ${message}

Important Rules:
1. Generate ONLY valid PostgreSQL SQL that is compatible with Supabase
2. Use ONLY tables and columns that exist in the schema above
3. Always filter by user_id = '${user.id}' to ensure users only see their own data
4. Return ONLY the SQL query, no explanations or markdown formatting
5. For SELECT queries, limit results to a reasonable number (e.g., LIMIT 100)
6. Use proper PostgreSQL syntax (e.g., use TEXT instead of VARCHAR, use DECIMAL for money)

Return the SQL query in this JSON format:
{
  "sql_query": "SELECT ... FROM ... WHERE user_id = '${user.id}' ..."
}`

    let sqlQuery: string = ''
    let queryResults: any[] = []

    try {
      // Generate SQL using Gemini
      let sqlResponse: string = ""
      try {
        const sqlResult = await model.generateContent(sqlGenerationPrompt)
        sqlResponse = sqlResult.response.text()
      } catch (geminiError: any) {
        console.error("Gemini API error:", geminiError)
        // Check if it's a 404 model not found error - try different model
        const errorMsg = geminiError?.message || String(geminiError)
        if (errorMsg.includes("404") || errorMsg.includes("not found")) {
          console.log("Model not found, trying alternative models...")
          // Try alternative models (with and without models/ prefix)
          const altModels = [
            "models/gemini-pro",
            "gemini-pro", 
            "models/gemini-1.5-flash",
            "gemini-1.5-flash",
            "models/gemini-1.5-pro",
            "gemini-1.5-pro"
          ]
          let worked = false
          for (const altModelName of altModels) {
            try {
              const altModel = genAI.getGenerativeModel({ model: altModelName })
              const altResult = await altModel.generateContent(sqlGenerationPrompt)
              sqlResponse = altResult.response.text()
              console.log(`Successfully used alternative model: ${altModelName}`)
              worked = true
              break
            } catch (altError) {
              console.warn(`Alternative model ${altModelName} also failed`)
            }
          }
          if (!worked || !sqlResponse) {
            throw new Error(`All Gemini models failed. Please check your API key and available models. Original error: ${errorMsg}`)
          }
        } else {
          throw new Error(`Failed to generate SQL query: ${errorMsg}`)
        }
      }

      // Parse JSON response to extract SQL
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = sqlResponse.match(/\{[\s\S]*"sql_query"[\s\S]*\}/)
        const jsonStr = jsonMatch ? jsonMatch[0] : sqlResponse
        const parsed = JSON.parse(jsonStr)
        sqlQuery = parsed.sql_query || parsed.sql || sqlResponse.trim()
      } catch (parseError) {
        // If JSON parsing fails, try to extract SQL directly
        // Remove markdown code blocks if present
        sqlQuery = sqlResponse
          .replace(/```sql\n?/g, '')
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()
        
        // Try to extract SQL from JSON-like structure
        const sqlMatch = sqlQuery.match(/"sql_query"\s*:\s*"([^"]+)"/)
        if (sqlMatch) {
          sqlQuery = sqlMatch[1].replace(/\\n/g, ' ')
        }
      }

      // Ensure user_id filter is present for security
      if (!sqlQuery.toLowerCase().includes('user_id') && !sqlQuery.toLowerCase().includes('where')) {
        // Add user_id filter if not present
        if (sqlQuery.toLowerCase().includes('select')) {
          sqlQuery = sqlQuery.replace(/FROM\s+(\w+)/i, `FROM $1 WHERE user_id = '${user.id}'`)
        }
      } else if (sqlQuery.toLowerCase().includes('where') && !sqlQuery.toLowerCase().includes(`user_id = '${user.id}'`)) {
        // Add user_id to existing WHERE clause
        sqlQuery = sqlQuery.replace(/WHERE\s+/i, `WHERE user_id = '${user.id}' AND `)
      }

      // Step 2: Execute SQL query
      try {
        queryResults = await runSupabaseQuery(sqlQuery)
      } catch (queryError) {
        console.error("SQL execution error:", queryError)
        // If SQL execution fails, continue without data
        queryResults = []
      }

    } catch (sqlGenError) {
      console.error("SQL generation error:", sqlGenError)
      // If SQL generation fails, proceed without database query
      queryResults = []
    }

    // Step 3: Analyze results and generate insights
    const analysisPrompt = queryResults.length > 0
      ? `${AI_COACH_SYSTEM_PROMPT}

I ran a SQL query to answer the user's question, and here are the results:

Original Question: ${message}

Query Results (JSON):
${JSON.stringify(queryResults, null, 2)}

Database Schema Context:
${dbSchema}

Based on the query results and the original question, provide:
1. A clear summary of what the data shows
2. 3-5 actionable insights for improving their business
3. Specific recommendations based on the data

Be practical, concise, and actionable. Use markdown formatting for readability.`
      : `${AI_COACH_SYSTEM_PROMPT}

The user asked: "${message}"

I wasn't able to query the database for this question, but I can still provide general business coaching advice.

Provide helpful guidance based on the question. Be practical, concise, and actionable. Use markdown formatting for readability.`

    // Generate final response
    let reply: string = ""
    try {
      const analysisResult = await model.generateContent(analysisPrompt)
      reply = analysisResult.response.text()
    } catch (geminiError: any) {
      console.error("Gemini analysis error:", geminiError)
      // Check if it's a 404 model not found error - try different model
      const errorMsg = geminiError?.message || String(geminiError)
      if (errorMsg.includes("404") || errorMsg.includes("not found")) {
        console.log("Model not found for analysis, trying alternative models...")
          // Try alternative models (with and without models/ prefix)
          const altModels = [
            "models/gemini-pro",
            "gemini-pro", 
            "models/gemini-1.5-flash",
            "gemini-1.5-flash",
            "models/gemini-1.5-pro",
            "gemini-1.5-pro"
          ]
        let worked = false
        for (const altModelName of altModels) {
          try {
            const altModel = genAI.getGenerativeModel({ model: altModelName })
            const altResult = await altModel.generateContent(analysisPrompt)
            reply = altResult.response.text()
            console.log(`Successfully used alternative model for analysis: ${altModelName}`)
            worked = true
            break
          } catch (altError) {
            console.warn(`Alternative model ${altModelName} also failed for analysis`)
          }
        }
        if (!worked || !reply) {
          throw new Error(`All Gemini models failed for analysis. Please check your API key and available models. Original error: ${errorMsg}`)
        }
      } else {
        throw new Error(`Failed to generate analysis: ${errorMsg}`)
      }
    }

    return NextResponse.json({
      reply,
      // Include query info in development (remove in production for security)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          sqlQuery: sqlQuery || 'No SQL generated',
          resultCount: queryResults.length,
        },
      }),
    })
  } catch (error) {
    console.error("AI Coach API error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // Log full error details for debugging
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      geminiApiKey: process.env.GEMINI_API_KEY ? "Set" : "Missing",
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Missing",
    })
    
    return NextResponse.json(
      { 
        error: errorMessage || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
