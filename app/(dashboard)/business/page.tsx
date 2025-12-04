"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { TrendingUp, DollarSign, Users, Target, Plus, Trash2, Megaphone } from "lucide-react"
import { useState } from "react"

interface Campaign {
  id: string
  name: string
  status: string
  budget: string
  spent: string
  impressions: string
  clicks: string
  conversions: string
  roas: string
}

interface Business {
  id: string
  name: string
  campaigns: Campaign[]
}

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<Business[]>([
    {
      id: "1",
      name: "Church Track",
      campaigns: [
        {
          id: "1",
          name: "Sunday Service Promotion",
          status: "Active",
          budget: "$2,500",
          spent: "$1,850",
          impressions: "45,230",
          clicks: "1,234",
          conversions: "89",
          roas: "3.2x",
        },
        {
          id: "2",
          name: "Community Outreach",
          status: "Active",
          budget: "$1,800",
          spent: "$1,200",
          impressions: "32,150",
          clicks: "890",
          conversions: "45",
          roas: "2.8x",
        },
        {
          id: "3",
          name: "Youth Program Campaign",
          status: "Paused",
          budget: "$1,200",
          spent: "$450",
          impressions: "18,900",
          clicks: "567",
          conversions: "23",
          roas: "2.1x",
        },
      ],
    },
    {
      id: "2",
      name: "Real Estate and Marketing Agency",
      campaigns: [
        {
          id: "4",
          name: "Property Listings Ads",
          status: "Active",
          budget: "$5,000",
          spent: "$3,200",
          impressions: "125,450",
          clicks: "3,456",
          conversions: "156",
          roas: "4.5x",
        },
        {
          id: "5",
          name: "Lead Generation Campaign",
          status: "Active",
          budget: "$4,500",
          spent: "$2,800",
          impressions: "98,230",
          clicks: "2,890",
          conversions: "134",
          roas: "3.9x",
        },
        {
          id: "6",
          name: "Brand Awareness",
          status: "Active",
          budget: "$3,000",
          spent: "$1,950",
          impressions: "156,780",
          clicks: "4,123",
          conversions: "78",
          roas: "2.5x",
        },
      ],
    },
  ])

  const updateCampaign = (
    businessId: string,
    campaignId: string,
    field: keyof Campaign,
    value: string
  ) => {
    setBusinesses((prev) =>
      prev.map((business) =>
        business.id === businessId
          ? {
              ...business,
              campaigns: business.campaigns.map((campaign) =>
                campaign.id === campaignId ? { ...campaign, [field]: value } : campaign
              ),
            }
          : business
      )
    )
  }

  const addCampaign = (businessId: string) => {
    setBusinesses((prev) =>
      prev.map((business) =>
        business.id === businessId
          ? {
              ...business,
              campaigns: [
                ...business.campaigns,
                {
                  id: `${businessId}-${Date.now()}`,
                  name: "New Campaign",
                  status: "Draft",
                  budget: "$0",
                  spent: "$0",
                  impressions: "0",
                  clicks: "0",
                  conversions: "0",
                  roas: "0x",
                },
              ],
            }
          : business
      )
    )
  }

  const deleteCampaign = (businessId: string, campaignId: string) => {
    setBusinesses((prev) =>
      prev.map((business) =>
        business.id === businessId
          ? {
              ...business,
              campaigns: business.campaigns.filter((c) => c.id !== campaignId),
            }
          : business
      )
    )
  }
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Hub</h1>
        <p className="text-muted-foreground">
          Overview of your business metrics and KPIs
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,350</div>
            <p className="text-xs text-muted-foreground">
              +180 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.4% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Goals
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8/10</div>
            <p className="text-xs text-muted-foreground">
              80% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart placeholder
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart placeholder
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Tracking Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              Campaigns Tracking
            </h2>
            <p className="text-muted-foreground">
              Track and manage your marketing campaigns across all businesses
            </p>
          </div>
        </div>

        {businesses.map((business) => (
          <Card key={business.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{business.name}</CardTitle>
                  <CardDescription>
                    {business.campaigns.length} active campaign{business.campaigns.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button onClick={() => addCampaign(business.id)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Campaign Name</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[120px]">Budget</TableHead>
                      <TableHead className="w-[120px]">Spent</TableHead>
                      <TableHead className="w-[120px]">Impressions</TableHead>
                      <TableHead className="w-[120px]">Clicks</TableHead>
                      <TableHead className="w-[120px]">Conversions</TableHead>
                      <TableHead className="w-[120px]">ROAS</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {business.campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <Input
                            value={campaign.name}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "name", e.target.value)
                            }
                            className="border-0 p-0 h-auto font-medium bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.status}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "status", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.budget}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "budget", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.spent}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "spent", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.impressions}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "impressions", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.clicks}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "clicks", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.conversions}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "conversions", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={campaign.roas}
                            onChange={(e) =>
                              updateCampaign(business.id, campaign.id, "roas", e.target.value)
                            }
                            className="border-0 p-0 h-auto bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCampaign(business.id, campaign.id)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


