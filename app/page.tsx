"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Tenn Men AI
        </h1>
        <p className="text-xl text-muted-foreground">
          Elite Real Estate Intelligence Platform. Manage properties, track campaigns, 
          and grow your real estate business with AI-powered insights.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

