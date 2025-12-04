"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Building2, Link as LinkIcon, Globe, Grid3x3, Rocket, CreditCard, ArrowRight } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { AiCoachSlideout } from "@/components/ai-coach/ai-coach-slideout"
import { buildAgencyContext } from "@/lib/ai-coach/context-builder"
import { GoHighLevelClient, ClientMetrics } from "@/types/gohighlevel"
import { useEffect, useState } from "react"
import Link from "next/link"

// Mock data - replace with real API calls
const mockAgencyClients: GoHighLevelClient[] = [
  {
    id: "1",
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+1-555-0101",
    company: "Acme Corp",
    subscriptionPlan: "professional",
    affiliateUserId: "user_123",
    createdAt: "2024-01-15",
    updatedAt: "2024-11-30",
    status: "active",
  },
  {
    id: "2",
    name: "Tech Startup Inc",
    email: "hello@techstartup.com",
    company: "Tech Startup Inc",
    subscriptionPlan: "agency",
    affiliateUserId: "user_123",
    createdAt: "2024-02-20",
    updatedAt: "2024-11-30",
    status: "active",
  },
]

const mockAgencyMetrics: Record<string, ClientMetrics> = {
  "1": {
    clientId: "1",
    currentWeek: {
      clientId: "1",
      weekStart: "2024-11-25",
      weekEnd: "2024-12-01",
      views: 1247,
      leads: 34,
      conversions: 12,
      revenue: 3400,
    },
    lastWeek: {
      clientId: "1",
      weekStart: "2024-11-18",
      weekEnd: "2024-11-24",
      views: 1156,
      leads: 28,
      conversions: 10,
      revenue: 2800,
    },
    thisMonth: {
      views: 5234,
      leads: 142,
      conversions: 48,
      revenue: 14200,
    },
    allTime: {
      views: 45678,
      leads: 1234,
      conversions: 456,
      revenue: 123400,
    },
  },
  "2": {
    clientId: "2",
    currentWeek: {
      clientId: "2",
      weekStart: "2024-11-25",
      weekEnd: "2024-12-01",
      views: 2341,
      leads: 67,
      conversions: 23,
      revenue: 6700,
    },
    lastWeek: {
      clientId: "2",
      weekStart: "2024-11-18",
      weekEnd: "2024-11-24",
      views: 2156,
      leads: 59,
      conversions: 20,
      revenue: 5900,
    },
    thisMonth: {
      views: 9876,
      leads: 289,
      conversions: 98,
      revenue: 28900,
    },
    allTime: {
      views: 78901,
      leads: 2345,
      conversions: 789,
      revenue: 234500,
    },
  },
}

export default function AgencyPage() {
  const { user } = useUser()
  const [context, setContext] = useState<any>(null)

  useEffect(() => {
    if (user) {
      // Filter clients for current user
      const userClients = mockAgencyClients.filter((c) => c.affiliateUserId === user.id)
      const ctx = buildAgencyContext(user.id, userClients, mockAgencyMetrics)
      setContext(ctx)
    }
  }, [user])
  const clients = [
    {
      id: "1",
      name: "Acme Corp",
      status: "Active",
      contacts: 3,
      websites: 2,
      tasks: 5,
    },
    {
      id: "2",
      name: "Tech Startup Inc",
      status: "Onboarding",
      contacts: 1,
      websites: 1,
      tasks: 2,
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Management</h1>
          <p className="text-muted-foreground">
            Manage your agency tools and resources
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Agency Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Link href="/websites">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                Websites & Tech Stack
              </CardTitle>
              <CardDescription>
                Manage your websites and technology stack
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">View websites</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/board">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Grid3x3 className="h-6 w-6 text-primary" />
                Flexboard
              </CardTitle>
              <CardDescription>
                Your visual workspace board
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open flexboard</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ghl-clients">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Rocket className="h-6 w-6 text-primary" />
                GoHighLevel Clients
              </CardTitle>
              <CardDescription>
                Manage your GoHighLevel client accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">View clients</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/subscriptions">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                Subscriptions
              </CardTitle>
              <CardDescription>
                Track and manage your subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">View subscriptions</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Agency Clients Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Agency Clients</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {client.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {client.status}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Contacts
                    </span>
                    <span className="text-sm font-semibold">{client.contacts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      Websites
                    </span>
                    <span className="text-sm font-semibold">{client.websites}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tasks</span>
                    <span className="text-sm font-semibold">{client.tasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Coach Slideout */}
      {context && (
        <AiCoachSlideout
          context={context}
          quickActions={[
            { label: "Analyze clients", message: "Analyze my agency clients. Which ones are performing best and where can I improve?" },
            { label: "Client strategy", message: "Give me a strategy to grow my agency client base and improve retention." },
            { label: "Focus today", message: "What should I focus on today to move my agency forward?" },
          ]}
        />
      )}
    </div>
  )
}


