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

    // Create placeholder for streaming response
    const assistantMessageId = Date.now().toString()
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
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

      // Check if response is streaming (text/event-stream) or JSON
      const contentType = response.headers.get("content-type") || ""
      
      if (contentType.includes("text/event-stream")) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let accumulatedText = ""

        if (!reader) {
          throw new Error("No response body")
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          // Update the assistant message in real-time
          setMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage.role === "assistant") {
              lastMessage.content = accumulatedText
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
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === "assistant") {
            lastMessage.content = data.reply || "I apologize, but I couldn't generate a response."
          }
          return newMessages
        })
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

