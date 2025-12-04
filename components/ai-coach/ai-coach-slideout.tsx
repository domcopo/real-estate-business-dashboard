"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X, Brain } from "lucide-react"
import { AiCoachPanel } from "./ai-coach-panel"
import { BusinessContext } from "@/lib/ai-coach/context-builder"
import { cn } from "@/lib/utils"

interface AiCoachSlideoutProps {
  context: BusinessContext
  quickActions?: Array<{
    label: string
    message: string
  }>
  onClose?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function AiCoachSlideout({ context, quickActions, onClose, isOpen: externalIsOpen, onOpenChange, title = "AI Coach", icon: Icon = Sparkles }: AiCoachSlideoutProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalIsOpen(open)
    }
    if (!open && onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Floating Button - only show if not externally controlled */}
      {externalIsOpen === undefined && (
        <Button
          onClick={() => handleOpenChange(true)}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-40"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      )}

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l shadow-2xl z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Panel */}
          <div className="flex-1 overflow-hidden">
            <AiCoachPanel initialContext={context} quickActions={quickActions} />
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => handleOpenChange(false)}
        />
      )}
    </>
  )
}

