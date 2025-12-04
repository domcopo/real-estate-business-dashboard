import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { runSupabaseQuery } from "@/lib/database"
import { getDatabaseSchema } from "@/lib/database-schema"
import { AI_COACH_SYSTEM_PROMPT } from "@/lib/ai-coach/system-prompt"
import { getCachedResponse, setCachedResponse } from "@/lib/ai-coach/cache"

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
    const { 
      message, 
      stream: useStreaming = true,
      pageContext = null, // New: page context (e.g., "dashboard", "properties", "agency", "business")
      pageData = null // New: specific data visible on the page
    } = body // Default to streaming

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Check cache first (skip cache if streaming is requested)
    if (!useStreaming) {
      const cached = getCachedResponse(user.id, message)
      if (cached) {
        console.log("Returning cached response")
        return NextResponse.json({
          reply: cached.response,
          cached: true,
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              sqlQuery: cached.sqlQuery || 'No SQL generated',
              resultCount: cached.resultCount || 0,
            },
          }),
        })
      }
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
    // Make the query more targeted based on question context
    const sqlGenerationPrompt = `You are a PostgreSQL/Supabase SQL expert. Generate a SQL query to answer the user's question.

Database Schema:
${dbSchema}

User Question: ${message}

Important Rules:
1. Generate ONLY valid PostgreSQL SQL that is compatible with Supabase
2. Use ONLY tables and columns that exist in the schema above
3. Always filter by user_id = '${user.id}' to ensure users only see their own data
4. Return ONLY the SQL query, no explanations or markdown formatting
5. For SELECT queries, limit results to a reasonable number (e.g., LIMIT 50 for lists, no limit for counts/sums)
6. Use proper PostgreSQL syntax (e.g., use TEXT instead of VARCHAR, use DECIMAL for money)
7. Focus on the MOST RELEVANT data for the question - don't query everything
8. If the question is about properties, prioritize the properties table and related tables (rent_roll_units, work_requests)
9. If the question is about subscriptions, focus on the subscriptions table
10. If the question is about clients, focus on ghl_clients and ghl_weekly_metrics tables

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
        console.log(`Executing SQL query: ${sqlQuery}`)
        queryResults = await runSupabaseQuery(sqlQuery)
        console.log(`Query returned ${queryResults.length} rows`)
        if (queryResults.length > 0) {
          console.log(`Sample result:`, JSON.stringify(queryResults[0], null, 2))
        }
      } catch (queryError) {
        console.error("SQL execution error:", queryError)
        console.error(`Failed SQL: ${sqlQuery}`)
        // If SQL execution fails, continue without data
        queryResults = []
      }

    } catch (sqlGenError) {
      console.error("SQL generation error:", sqlGenError)
      // If SQL generation fails, proceed without database query
      queryResults = []
    }

    // Step 3: Automatically query relevant data based on page context (even if not explicitly asked)
    let autoQueryResults: any[] = []
    let autoQuerySQL: string = ''
    
    if (pageContext) {
      try {
        // Generate automatic context queries based on page
        let autoQueryPrompt = `Generate a SQL query to get the most relevant data for a user on the "${pageContext}" page. 
        
Database Schema:
${dbSchema}

User ID: ${user.id}

Generate a query that would give useful context about what's on this page. For example:
- If page is "properties": Get all properties with key metrics (address, status, cash flow, ROE)
- If page is "dashboard": Get portfolio summary (total properties, total cash flow, top performers)
- If page is "agency": Get all clients with their metrics
- If page is "business": Get campaigns data

Return ONLY the SQL query in JSON format:
{
  "sql_query": "SELECT ... FROM ... WHERE user_id = '${user.id}' ..."
}`

        const autoQueryResponse = await model.generateContent(autoQueryPrompt)
        const autoQueryText = autoQueryResponse.response.text()
        
        // Parse SQL from response
        try {
          const jsonMatch = autoQueryText.match(/\{[\s\S]*"sql_query"[\s\S]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : autoQueryText
          const parsed = JSON.parse(jsonStr)
          autoQuerySQL = parsed.sql_query || parsed.sql || autoQueryText.trim()
        } catch {
          autoQuerySQL = autoQueryText.replace(/```sql\n?/g, '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        }

        // Execute automatic query
        if (autoQuerySQL && !autoQuerySQL.toLowerCase().includes('insert') && !autoQuerySQL.toLowerCase().includes('update') && !autoQuerySQL.toLowerCase().includes('delete')) {
          try {
            autoQueryResults = await runSupabaseQuery(autoQuerySQL)
            console.log(`Auto-query returned ${autoQueryResults.length} rows for page context: ${pageContext}`)
          } catch (err) {
            console.warn("Auto-query failed:", err)
          }
        }
      } catch (err) {
        console.warn("Failed to generate auto-query:", err)
      }
    }

    // Step 4: Build page context information
    let pageContextInfo = ""
    if (pageContext) {
      pageContextInfo = `\n**Current Page Context:** The user is on the "${pageContext}" page.`
      
      // Add page-specific guidance
      switch (pageContext.toLowerCase()) {
        case "dashboard":
          pageContextInfo += ` Focus on overall portfolio health, top performers, and biggest opportunities across all their businesses.`
          break
        case "properties":
        case "property":
          pageContextInfo += ` Focus on individual property performance, cash flow analysis, ROE calculations, and property-specific opportunities.`
          break
        case "agency":
        case "agency management":
          pageContextInfo += ` Focus on client performance, marketing ROI, growth strategies, and agency metrics.`
          break
        case "business":
        case "business hub":
          pageContextInfo += ` Focus on campaigns performance, revenue trends, business metrics, and marketing optimization.`
          break
        case "campaigns":
          pageContextInfo += ` Focus on campaign ROI, performance metrics, budget optimization, and marketing strategy.`
          break
      }
    }

    // Add page-specific data if provided
    if (pageData && typeof pageData === 'object') {
      pageContextInfo += `\n\n**Page-Specific Data Available:**\n${JSON.stringify(pageData, null, 2)}\n\nUse this data to provide context-aware insights. Reference specific numbers, properties, campaigns, or metrics visible on the page.`
    }

    // Add auto-query results
    if (autoQueryResults.length > 0) {
      pageContextInfo += `\n\n**Automatic Context Data (from database):**\n${JSON.stringify(autoQueryResults, null, 2)}\n\nThis data is automatically available from their database. USE IT in your response - reference specific numbers, properties, or metrics.`
    }

    // Step 5: Combine query results with auto-query results
    const allQueryResults = queryResults.length > 0 ? queryResults : autoQueryResults
    const allSQLQueries = [sqlQuery, autoQuerySQL].filter(Boolean).join('; ')

    // Step 6: Analyze results and generate insights
    const hasData = allQueryResults.length > 0
    const dataSummary = hasData 
      ? `Here's the data from the database:

${JSON.stringify(allQueryResults, null, 2)}

**SQL Query Used:** ${allSQLQueries || 'Auto-query based on page context'}

**Database Schema Context:**
${dbSchema}

**CRITICAL:** You MUST reference the actual data numbers in your response. Use specific property addresses, exact dollar amounts, percentages, and metrics from the data above. Be BRIEF - 1-3 sentences max unless they ask for details.`
      : `No specific data found in the database for this question. 

**SQL Query Attempted:** ${allSQLQueries || 'No SQL query was generated'}

**Note:** Provide brief real estate coaching advice based on page context and general principles. Keep it SHORT - 1-2 sentences.`

    const analysisPrompt = `${AI_COACH_SYSTEM_PROMPT}

**User's Question:** "${message}"
${pageContextInfo}

${dataSummary}

**Your Response Guidelines:**
- **BE BRIEF**: 1-3 sentences MAXIMUM unless they explicitly ask for details, analysis, or "tell me more"
- Use the page context automatically - reference what's on their screen
- Reference specific numbers from the database OR page data (e.g., "You have 5 properties", "Your campaign ROAS is 3.2x", "Property at 123 Main St has 18% ROE")
- Be energetic and motivational but data-driven
- Provide ONE actionable insight, not multiple
- Optional: Ask ONE quick follow-up question
- If analyzing properties: mention ROE, cash flow, or key metric briefly
- If analyzing campaigns: mention ROAS or key metric briefly
- Always use their actual data - don't speak in generalities

**CRITICAL:** Default to SHORT responses. Only expand if they explicitly ask for more detail, analysis, or explanation.

**Remember:** You're ELO AI - Elite Real Estate Intelligence. Brief, data-driven, actionable!`

    // Generate final response (streaming or regular)
    if (useStreaming) {
      // Streaming response
      try {
        const stream = await model.generateContentStream(analysisPrompt)
        
        // Create a readable stream with proper chunking
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
          async start(controller) {
            let fullResponse = ""
            try {
              // Process stream chunks - send immediately as they arrive
              let chunkCount = 0
              for await (const chunk of stream.stream) {
                try {
                  const chunkText = chunk.text()
                  if (chunkText) {
                    chunkCount++
                    fullResponse += chunkText
                    // Send each chunk immediately - don't buffer
                    // Send as UTF-8 encoded text
                    controller.enqueue(encoder.encode(chunkText))
                    console.log(`Sent chunk ${chunkCount}, length: ${chunkText.length}`)
                  }
                } catch (chunkError) {
                  console.warn("Error processing chunk:", chunkError)
                  // Continue with next chunk
                }
              }
              
              console.log(`Streaming complete. Processed ${chunkCount} chunks. Total length: ${fullResponse.length}`)
              
              // Cache the full response after streaming completes
              setCachedResponse(user.id, message, fullResponse, {
                sqlQuery: sqlQuery || undefined,
                resultCount: queryResults.length,
              })
              
              controller.close()
            } catch (streamError) {
              console.error("Streaming error:", streamError)
              const errorText = `\n\nError: ${streamError instanceof Error ? streamError.message : String(streamError)}`
              controller.enqueue(encoder.encode(errorText))
              controller.close()
            }
          },
        })

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8', // Use plain text instead of event-stream
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable buffering in nginx
            'Transfer-Encoding': 'chunked',
          },
        })
      } catch (geminiError: any) {
        console.error("Gemini streaming error:", geminiError)
        // Fallback to non-streaming - continue to regular response below
      }
    }

    // Non-streaming response (or fallback)
    let reply: string = ""
    try {
      const analysisResult = await model.generateContent(analysisPrompt)
      reply = analysisResult.response.text()
      
      // Cache the response
      setCachedResponse(user.id, message, reply, {
        sqlQuery: sqlQuery || undefined,
        resultCount: queryResults.length,
      })
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
            
            // Cache the response
            setCachedResponse(user.id, message, reply, {
              sqlQuery: sqlQuery || undefined,
              resultCount: queryResults.length,
            })
            
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
      cached: false,
      // Include query info so user can see what data was accessed
      dataInfo: {
        sqlQuery: sqlQuery || 'No SQL generated',
        resultCount: queryResults.length,
        hasData: queryResults.length > 0,
        sampleData: queryResults.length > 0 ? queryResults.slice(0, 3) : null, // First 3 rows as sample
      },
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
