"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ExternalLink, Edit, Trash2 } from "lucide-react"
import { SaveButton } from "@/components/ui/save-button"
import { useUser } from "@clerk/nextjs"

interface Website {
  id: string
  url: string
  name: string
  techStack: {
    frontend: string
    backend: string
    hosting: string
    analytics: string
    payments: string
  }
}

export default function WebsitesPage() {
  const { user } = useUser()
  const [websites, setWebsites] = useState<Website[]>([
    {
      id: "1",
      url: "https://example.com",
      name: "Example Site",
      techStack: {
        frontend: "React",
        backend: "Node.js",
        hosting: "Vercel",
        analytics: "Google Analytics",
        payments: "Stripe",
      },
    },
    {
      id: "2",
      url: "https://another.com",
      name: "Another Site",
      techStack: {
        frontend: "Next.js",
        backend: "Supabase",
        hosting: "Vercel",
        analytics: "Plausible",
        payments: "Stripe",
      },
    },
  ])

  // Load websites from database on mount
  useEffect(() => {
    async function loadWebsites() {
      if (!user) return

      try {
        const response = await fetch('/api/websites')
        if (response.ok) {
          const data = await response.json()
          if (data.websites && data.websites.length > 0) {
            const loadedWebsites: Website[] = data.websites.map((w: any) => ({
              id: w.id,
              url: w.url,
              name: w.name,
              techStack: w.tech_stack || {
                frontend: "",
                backend: "",
                hosting: "",
                analytics: "",
                payments: "",
              },
            }))
            setWebsites(loadedWebsites)
          }
        }
      } catch (error) {
        console.error('Failed to load websites:', error)
      }
    }

    loadWebsites()
  }, [user])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websites: websites,
          workspaceId: null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return // Success - SaveButton will show success state
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save websites')
      }
    } catch (error: any) {
      console.error('Error saving websites:', error)
      throw error // Re-throw so SaveButton can handle it
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites & Tech Stack</h1>
          <p className="text-muted-foreground">
            Manage all your websites and their technical details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton onSave={handleSave} />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Website
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {websites.map((website) => (
          <Card key={website.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{website.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {website.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Frontend: </span>
                  <span className="text-sm text-muted-foreground">
                    {website.techStack.frontend}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Backend: </span>
                  <span className="text-sm text-muted-foreground">
                    {website.techStack.backend}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Hosting: </span>
                  <span className="text-sm text-muted-foreground">
                    {website.techStack.hosting}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Analytics: </span>
                  <span className="text-sm text-muted-foreground">
                    {website.techStack.analytics}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Payments: </span>
                  <span className="text-sm text-muted-foreground">
                    {website.techStack.payments}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


