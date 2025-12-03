"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { GoHighLevelButton } from "@/components/layout/gohighlevel-button"
import { InvitationPrompt } from "@/components/team/invitation-prompt"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Show timeout message if Clerk takes too long (likely misconfigured)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setLoadingTimeout(true)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timer)
  }, [isLoaded])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router])

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">
            {loadingTimeout ? (
              <div className="space-y-2">
                <p>Loading is taking longer than expected...</p>
                <p className="text-sm">Make sure Clerk is configured in .env.local</p>
                <button
                  onClick={() => router.push("/sign-in")}
                  className="text-primary hover:underline text-sm"
                >
                  Go to Sign In →
                </button>
              </div>
            ) : (
              "Loading..."
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="flex h-screen relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
      
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        {children}
      </main>
      
      <GoHighLevelButton />
      
      {/* Invitation Prompt - shows when user has pending invitations */}
      <InvitationPrompt />
    </div>
  )
}

