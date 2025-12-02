"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, DollarSign } from "lucide-react"
import { SaveButton } from "@/components/ui/save-button"
import { useUser } from "@clerk/nextjs"

interface Subscription {
  id: string
  name: string
  cost: number
  period: "monthly" | "annual"
  renewalDate: string
  category: string
  website?: string
}

export default function SubscriptionsPage() {
  const { user } = useUser()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: "1",
      name: "Netflix",
      cost: 15.99,
      period: "monthly",
      renewalDate: "2024-02-15",
      category: "Entertainment",
      website: "example.com",
    },
    {
      id: "2",
      name: "Adobe Creative Cloud",
      cost: 52.99,
      period: "monthly",
      renewalDate: "2024-02-20",
      category: "Software",
      website: "another.com",
    },
    {
      id: "3",
      name: "Vercel Pro",
      cost: 20,
      period: "monthly",
      renewalDate: "2024-02-10",
      category: "Hosting",
      website: "example.com",
    },
  ])

  // Load subscriptions from database on mount
  useEffect(() => {
    async function loadSubscriptions() {
      if (!user) return

      try {
        const response = await fetch('/api/subscriptions')
        if (response.ok) {
          const data = await response.json()
          if (data.subscriptions && data.subscriptions.length > 0) {
            const loadedSubscriptions: Subscription[] = data.subscriptions.map((s: any) => ({
              id: s.id,
              name: s.name,
              cost: parseFloat(s.cost) || 0,
              period: s.period,
              renewalDate: s.renewal_date,
              category: s.category,
              website: s.website_id || undefined,
            }))
            setSubscriptions(loadedSubscriptions)
          }
        }
      } catch (error) {
        console.error('Failed to load subscriptions:', error)
      }
    }

    loadSubscriptions()
  }, [user])

  const handleSave = async () => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptions: subscriptions,
          workspaceId: null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return // Success - SaveButton will show success state
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save subscriptions')
      }
    } catch (error: any) {
      console.error('Error saving subscriptions:', error)
      throw error // Re-throw so SaveButton can handle it
    }
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.cost, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track and manage your subscriptions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SaveButton onSave={handleSave} />
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spend</CardTitle>
          <CardDescription>Total cost of all active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            {totalMonthly.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{subscription.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {subscription.category} • {subscription.website}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${subscription.cost.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    /{subscription.period}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Renews on {new Date(subscription.renewalDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


