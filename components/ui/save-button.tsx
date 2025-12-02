"use client"

import { Button } from "@/components/ui/button"
import { Save, Loader2, Check } from "lucide-react"
import { useState } from "react"

interface SaveButtonProps {
  onSave: () => Promise<void> | void
  disabled?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showSuccessIcon?: boolean
}

export function SaveButton({
  onSave,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
  showSuccessIcon = true,
}: SaveButtonProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await onSave()
      setSaved(true)
      // Reset saved state after 2 seconds
      setTimeout(() => setSaved(false), 2000)
    } catch (error: any) {
      console.error("Save error:", error)
      // Show error to user
      alert(`Failed to save: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSave}
      disabled={disabled || saving}
      className={className}
    >
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : saved && showSuccessIcon ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Saved
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save
        </>
      )}
    </Button>
  )
}

