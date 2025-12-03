"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"
import { BusinessContext } from "@/lib/ai-coach/context-builder"
import { MarkdownRenderer } from "./markdown-renderer"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AiCoachPanelProps {
  initialContext: BusinessContext
  quickActions?: Array<{
    label: string
    message: string
  }>
}

const DEFAULT_QUICK_ACTIONS = [
  { label: "Analyze this week", message: "Analyze my performance this week. What's working and what needs attention?" },
  { label: "7-day growth plan", message: "Give me a 7-day action plan to grow my business." },
  { label: "Focus today", message: "What should I focus on today to move my business forward?" },
  { label: "Client summary", message: "Summarize performance across all my clients. Highlight top performers and areas for improvement." },
]

export function AiCoachPanel({ initialContext, quickActions = DEFAULT_QUICK_ACTIONS }: AiCoachPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI business coach. I can analyze your business data, provide insights, and help you create action plans. What would you like to know?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: messageText,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Create placeholder for streaming response with thinking indicator
    const assistantMessage: Message = {
      role: "assistant",
      content: "Thinking...", // Show thinking immediately
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/ai/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          stream: true, // Enable streaming
        }),
      })

      if (!response.ok) {
        // Try to parse error as JSON, fallback to text
        const errorData = await response.json().catch(async () => {
          const text = await response.text()
          return { error: text || "Failed to get AI response" }
        })
        const errorMsg = errorData.error || errorData.details || "Failed to get AI response"
        throw new Error(errorMsg)
      }

      // Check if response is streaming (text/plain or text/event-stream) or JSON
      const contentType = response.headers.get("content-type") || ""
      
      if (contentType.includes("text/plain") || contentType.includes("text/event-stream")) {
        // Handle streaming response - plain text chunks with typing simulation
        setIsLoading(false) // Stop loading indicator once streaming starts
        
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ""
        let displayedText = ""
        let hasReceivedFirstChunk = false
        let typingTimeout: NodeJS.Timeout | null = null

        if (!reader) {
          throw new Error("No response body")
        }

        // Typing simulation - add characters one at a time
        const typeNextChar = () => {
          if (displayedText.length < fullText.length) {
            displayedText = fullText.slice(0, displayedText.length + 1)
            
            setMessages((prev) => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]
              if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.content = displayedText
              }
              return newMessages
            })
            
            // Schedule next character (faster typing - 15-25ms per char)
            const nextChar = fullText[displayedText.length]
            const delay = nextChar && /[\s.,!?]/.test(nextChar) ? 15 : 20
            typingTimeout = setTimeout(typeNextChar, delay)
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Decode chunk and append to full text
          const chunk = decoder.decode(value, { stream: true })
          if (chunk) {
            // Replace "Thinking..." with first chunk, then append subsequent chunks
            if (!hasReceivedFirstChunk) {
              fullText = chunk
              displayedText = ""
              hasReceivedFirstChunk = true
              // Start typing simulation immediately
              typeNextChar()
            } else {
              // Append new chunk and continue typing
              fullText += chunk
              // If typing is caught up, continue typing new content
              if (!typingTimeout && displayedText.length >= fullText.length - chunk.length) {
                typeNextChar()
              }
            }
          }
        }
        
        // Ensure final text is displayed (wait for typing to catch up)
        const waitForTyping = () => {
          if (displayedText.length < fullText.length) {
            setTimeout(waitForTyping, 50)
          } else {
            // Typing complete
            setMessages((prev) => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]
              if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.content = fullText
              }
              return newMessages
            })
          }
        }
        waitForTyping()
        
        // Ensure we have content (remove "Thinking..." if no chunks received)
        if (!hasReceivedFirstChunk) {
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === "assistant") {
              lastMessage.content = "I'm processing your request..."
            }
            return newMessages
          })
        }
      } else {
        // Handle non-streaming JSON response (fallback or cached)
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        // Update the assistant message with full response
        let replyText = data.reply || "I apologize, but I couldn't generate a response."
        
        // Add database info if available (for visibility)
        if (data.dataInfo && data.dataInfo.hasData) {
          replyText += `\n\n_📊 Found ${data.dataInfo.resultCount} result(s) in your database_`
        } else if (data.dataInfo && !data.dataInfo.hasData && data.dataInfo.sqlQuery !== 'No SQL generated') {
          replyText += `\n\n_💡 Note: I queried your database but didn't find matching data_`
        }
        
        // Simulate typing for non-streaming responses too
        setIsLoading(false)
        let typedText = ""
        const typeResponse = () => {
          if (typedText.length < replyText.length) {
            typedText = replyText.slice(0, typedText.length + 1)
            setMessages((prev) => {
              const newMessages = [...prev]
              const lastMessage = newMessages[newMessages.length - 1]
              if (lastMessage.role === "assistant") {
                lastMessage.content = typedText
              }
              return newMessages
            })
            setTimeout(typeResponse, 20) // Type 20ms per character
          }
        }
        typeResponse()
        
        // Log database info to console for debugging
        if (data.dataInfo) {
          console.log("Database Query Info:", {
            sql: data.dataInfo.sqlQuery,
            resultCount: data.dataInfo.resultCount,
            hasData: data.dataInfo.hasData,
            sampleData: data.dataInfo.sampleData,
          })
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Update the error message
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage.role === "assistant") {
          lastMessage.content = error instanceof Error 
            ? `Error: ${error.message}` 
            : "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickAction = (message: string) => {
    sendMessage(message)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions */}
      <div className="p-4 border-b space-y-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction(action.message)}
              disabled={isLoading}
              className="text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.role === "assistant" ? (
                <MarkdownRenderer content={message.content} />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            id="aiCoachInput"
            name="aiCoachInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your business..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

