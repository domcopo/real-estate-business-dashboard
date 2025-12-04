"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import { AiCoachSlideout } from "@/components/ai-coach/ai-coach-slideout"
import { BusinessContext } from "@/lib/ai-coach/context-builder"
import { useUser } from "@clerk/nextjs"
import { usePageData } from "./page-data-context"

export function EloAiButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<BusinessContext | null>(null)
  const { user } = useUser()
  const pathname = usePathname()
  const { pageData } = usePageData()

  // Detect page context from pathname
  const getPageContext = (path: string): string | null => {
    if (path.includes("/dashboard")) return "dashboard"
    if (path.includes("/properties")) return "properties"
    if (path.includes("/agency")) return "agency"
    if (path.includes("/business")) return "business"
    if (path.includes("/campaigns")) return "campaigns"
    if (path.includes("/websites")) return "websites"
    if (path.includes("/subscriptions")) return "subscriptions"
    return null
  }

  const pageContext = getPageContext(pathname || "")

  useEffect(() => {
    if (user) {
      // Create a minimal general context
      const ctx: BusinessContext = {
        userId: user.id,
        summary: {
          clients: [],
        },
      }
      setContext(ctx)
    }
  }, [user])

  if (!context) return null

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-40 p-0"
        size="lg"
        title="ELO AI - Talk to your AI assistant"
      >
        <Brain className="h-5 w-5" />
      </Button>

      <AiCoachSlideout
        context={context}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onClose={() => setIsOpen(false)}
        title="ELO AI"
        icon={Brain}
        pageContext={pageContext || undefined}
        pageData={pageData || undefined}
      />
    </>
  )
}

