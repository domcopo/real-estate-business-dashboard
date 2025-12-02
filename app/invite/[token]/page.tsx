"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Mail, Check, X, Loader2, Users } from "lucide-react"
import Link from "next/link"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const token = params?.token as string
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast, toasts } = useToast()

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link")
      setLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        // We'll need to create an API endpoint to get invitation by token
        // For now, we'll handle it in the accept flow
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to load invitation")
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async () => {
    if (!user || !isLoaded) {
      // Redirect to sign in with return URL
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)
      return
    }

    setProcessing(true)
    try {
      // First, get the invitation ID from the token
      const response = await fetch(`/api/workspace/invitations/by-token?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find invitation')
      }

      const invitationId = data.invitation?.id
      if (!invitationId) {
        throw new Error('Invitation not found')
      }

      // Accept the invitation
      const acceptResponse = await fetch('/api/workspace/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      const acceptData = await acceptResponse.json()

      if (!acceptResponse.ok) {
        throw new Error(acceptData.error || 'Failed to accept invitation')
      }

      toast({
        title: "Success!",
        description: acceptData.message || "You've joined the workspace!",
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(err.message || "Failed to accept invitation")
      toast({
        title: "Error",
        description: err.message || "Failed to accept invitation",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!user || !isLoaded) {
      router.push('/sign-in')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/workspace/invitations/by-token?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find invitation')
      }

      const invitationId = data.invitation?.id
      if (!invitationId) {
        throw new Error('Invitation not found')
      }

      const declineResponse = await fetch(
        `/api/workspace/invitations/accept?invitationId=${invitationId}`,
        {
          method: 'DELETE',
        }
      )

      const declineData = await declineResponse.json()

      if (!declineResponse.ok) {
        throw new Error(declineData.error || 'Failed to decline invitation')
      }

      toast({
        title: "Invitation Declined",
        description: "The invitation has been declined",
      })

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error declining invitation:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to decline invitation",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Workspace Invitation</CardTitle>
            </div>
            <CardDescription>
              Sign in to accept this workspace invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You need to sign in to accept this invitation.
            </p>
            <div className="flex gap-2">
              <Link href={`/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`} className="flex-1">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href="/sign-up" className="flex-1">
                <Button variant="outline" className="w-full">Sign Up</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
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

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle>Workspace Invitation</CardTitle>
          </div>
          <CardDescription>
            You&apos;ve been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Click accept to join the workspace</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={processing}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              disabled={processing}
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

