"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Mail, Check, X, Users } from "lucide-react"

interface Invitation {
  id: string
  workspace_id: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  expires_at: string
  workspaces: {
    id: string
    name: string
  } | null
}

export function InvitationPrompt() {
  const { user, isLoaded } = useUser()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast, toasts } = useToast()

  useEffect(() => {
    if (!isLoaded || !user) {
      return
    }

    const fetchPendingInvitations = async () => {
      try {
        const response = await fetch('/api/workspace/invitations/pending')
        if (response.ok) {
          const data = await response.json()
          setInvitations(data.invitations || [])
        }
      } catch (error) {
        console.error('Error fetching pending invitations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingInvitations()
  }, [isLoaded, user])

  const handleAccept = async (invitationId: string) => {
    setProcessing(invitationId)
    try {
      const response = await fetch('/api/workspace/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast({
        title: "Success!",
        description: data.message || "You've joined the workspace",
      })

      // Remove accepted invitation from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))

      // Reload the page to refresh workspace data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleDecline = async (invitationId: string) => {
    setProcessing(invitationId)
    try {
      const response = await fetch(
        `/api/workspace/invitations/accept?invitationId=${invitationId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to decline invitation')
      }

      toast({
        title: "Invitation Declined",
        description: "The invitation has been declined",
      })

      // Remove declined invitation from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error: any) {
      console.error('Error declining invitation:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to decline invitation",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  if (!isLoaded || loading) {
    return null
  }

  if (invitations.length === 0) {
    return null
  }

  // Show the first pending invitation
  const invitation = invitations[0]
  const workspaceName = invitation.workspaces?.name || 'a workspace'

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg border ${
              t.variant === 'destructive'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            {t.title && <div className="font-semibold">{t.title}</div>}
            <div className="text-sm">{t.description}</div>
          </div>
        ))}
      </div>

      <Dialog open={true}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle>Workspace Invitation</DialogTitle>
            </div>
            <DialogDescription>
              You&apos;ve been invited to join <strong>{workspaceName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Workspace: {workspaceName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="outline" className={
                invitation.role === 'admin' 
                  ? 'bg-blue-50 text-blue-700' 
                  : ''
              }>
                {invitation.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
            </div>
            {invitations.length > 1 && (
              <div className="text-sm text-muted-foreground">
                You have {invitations.length - 1} more pending invitation{invitations.length - 1 !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleDecline(invitation.id)}
              disabled={processing === invitation.id}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={() => handleAccept(invitation.id)}
              disabled={processing === invitation.id}
              className="w-full sm:w-auto"
            >
              {processing === invitation.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

