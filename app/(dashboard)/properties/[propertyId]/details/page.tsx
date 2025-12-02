"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Property, RentRollUnit, WorkRequest } from "@/types"
import { ArrowLeft, Plus, Trash2, Save, Upload, FileText, Star, AlertCircle } from "lucide-react"
import { SaveButton } from "@/components/ui/save-button"

// Mock data - in production, this would come from an API
const mockProperties: Property[] = [
  {
    id: "1",
    address: "123 Main St, San Francisco, CA",
    type: "Apartment",
    status: "rented",
    mortgageHolder: "Chase Bank",
    purchasePrice: 750000,
    currentEstValue: 850000,
    monthlyMortgagePayment: 3200,
    monthlyInsurance: 150,
    monthlyPropertyTax: 800,
    monthlyOtherCosts: 200,
    monthlyGrossRent: 4500,
    rentRoll: [
      {
        unitName: "Unit 1A",
        tenantName: "John Doe",
        monthlyRent: 2500,
        leaseStart: "2024-01-01",
        leaseEnd: "2024-12-31",
        securityDeposit: 2500,
      },
      {
        unitName: "Unit 1B",
        tenantName: "Jane Smith",
        monthlyRent: 2000,
        leaseStart: "2024-02-01",
        leaseEnd: "2025-01-31",
        securityDeposit: 2000,
      },
    ],
    workRequests: [
      {
        id: "1",
        dateLogged: "2024-11-15",
        description: "Fix leaky faucet",
        status: "completed",
        cost: 150,
      },
    ],
  },
  {
    id: "2",
    address: "456 Oak Ave, Los Angeles, CA",
    type: "House",
    status: "rented",
    mortgageHolder: "Wells Fargo",
    purchasePrice: 1100000,
    currentEstValue: 1200000,
    monthlyMortgagePayment: 4800,
    monthlyInsurance: 250,
    monthlyPropertyTax: 1200,
    monthlyOtherCosts: 300,
    monthlyGrossRent: 6500,
    rentRoll: [
      {
        unitName: "Main House",
        tenantName: "Bob Johnson",
        monthlyRent: 6500,
        leaseStart: "2024-03-01",
        leaseEnd: "2025-02-28",
        securityDeposit: 6500,
      },
    ],
    workRequests: [],
  },
  {
    id: "3",
    address: "789 Pine Rd, San Diego, CA",
    type: "Condo",
    status: "vacant",
    mortgageHolder: "Bank of America",
    purchasePrice: 450000,
    currentEstValue: 500000,
    monthlyMortgagePayment: 2100,
    monthlyInsurance: 120,
    monthlyPropertyTax: 500,
    monthlyOtherCosts: 150,
    monthlyGrossRent: 0,
    rentRoll: [],
    workRequests: [
      {
        id: "2",
        dateLogged: "2024-11-20",
        description: "Paint interior",
        status: "in_progress",
        cost: 800,
      },
    ],
  },
]

export default function PropertyDetailsPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const resolvedParams = use(params)
  const propertyId = resolvedParams.propertyId
  const router = useRouter()

  // Find the property
  const property = propertyId ? mockProperties.find((p) => p.id === propertyId) : undefined

  // State for editable property data - MUST be called before any early returns
  const [propertyData, setPropertyData] = useState<Property | null>(property || null)
  const [rentRoll, setRentRoll] = useState<RentRollUnit[]>(
    property?.rentRoll || []
  )
  const [workRequests, setWorkRequests] = useState<WorkRequest[]>(
    property?.workRequests || []
  )
  const [newUnit, setNewUnit] = useState<Partial<RentRollUnit>>({})
  const [newWorkRequest, setNewWorkRequest] = useState<Partial<WorkRequest>>({})

  // Helper functions - must be defined before early return
  const calculateMonthlyCosts = (): number => {
    if (!propertyData) return 0
    return (
      propertyData.monthlyMortgagePayment +
      propertyData.monthlyInsurance +
      propertyData.monthlyPropertyTax +
      propertyData.monthlyOtherCosts
    )
  }

  const calculateMonthlyCashflow = (): number => {
    if (!propertyData) return 0
    return propertyData.monthlyGrossRent - calculateMonthlyCosts()
  }

  const calculateAnnualCashflow = (): number => {
    return calculateMonthlyCashflow() * 12
  }

  const calculateCapRate = (): number => {
    if (!propertyData || propertyData.currentEstValue === 0) return 0
    const netOperatingIncome = calculateAnnualCashflow()
    return (netOperatingIncome / propertyData.currentEstValue) * 100
  }

  const calculateCashOnCashReturn = (): number => {
    if (!propertyData) return 0
    const downPayment = propertyData.purchasePrice * 0.2 // Assuming 20% down
    if (downPayment === 0) return 0
    const annualCashflow = calculateAnnualCashflow()
    return (annualCashflow / downPayment) * 100
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const handlePropertyFieldChange = (field: keyof Property, value: any) => {
    setPropertyData((prev) => {
      if (!prev) return null
      return { ...prev, [field]: value }
    })
  }

  const handleSaveProperty = async () => {
    if (!propertyData || !propertyId) {
      throw new Error('Property data or ID missing')
    }

    try {
      // Save main property data
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: propertyData.address,
          type: propertyData.type,
          status: propertyData.status,
          mortgageHolder: propertyData.mortgageHolder,
          purchasePrice: propertyData.purchasePrice,
          currentEstValue: propertyData.currentEstValue,
          monthlyMortgagePayment: propertyData.monthlyMortgagePayment,
          monthlyInsurance: propertyData.monthlyInsurance,
          monthlyPropertyTax: propertyData.monthlyPropertyTax,
          monthlyOtherCosts: propertyData.monthlyOtherCosts,
          monthlyGrossRent: propertyData.monthlyGrossRent,
          ownership: propertyData.ownership,
          linkedWebsites: propertyData.linkedWebsites,
        }),
      })

      if (response.ok) {
        // TODO: Save rent roll units and work requests separately
        // For now, just save the main property
        return // Success - SaveButton will show success state
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save property')
      }
    } catch (error: any) {
      console.error('Error saving property:', error)
      throw error // Re-throw so SaveButton can handle it
    }
  }

  const handleAddUnit = () => {
    if (
      newUnit.unitName &&
      newUnit.tenantName &&
      newUnit.monthlyRent &&
      newUnit.leaseStart &&
      newUnit.leaseEnd &&
      newUnit.securityDeposit
    ) {
      setRentRoll([
        ...rentRoll,
        {
          unitName: newUnit.unitName,
          tenantName: newUnit.tenantName,
          monthlyRent: newUnit.monthlyRent,
          leaseStart: newUnit.leaseStart,
          leaseEnd: newUnit.leaseEnd,
          securityDeposit: newUnit.securityDeposit,
        },
      ])
      setNewUnit({})
      // Update monthly gross rent
      const totalRent = [...rentRoll, newUnit as RentRollUnit].reduce(
        (sum, unit) => sum + unit.monthlyRent,
        0
      )
      handlePropertyFieldChange("monthlyGrossRent", totalRent)
    }
  }

  const handleDeleteUnit = (index: number) => {
    const updated = rentRoll.filter((_, i) => i !== index)
    setRentRoll(updated)
    const totalRent = updated.reduce((sum, unit) => sum + unit.monthlyRent, 0)
    handlePropertyFieldChange("monthlyGrossRent", totalRent)
  }

  const handleAddWorkRequest = () => {
    if (newWorkRequest.description && newWorkRequest.dateLogged) {
      const workRequest: WorkRequest = {
        id: Date.now().toString(),
        dateLogged: newWorkRequest.dateLogged,
        description: newWorkRequest.description,
        status: (newWorkRequest.status as WorkRequest["status"]) || "new",
        cost: newWorkRequest.cost || 0,
      }
      setWorkRequests([...workRequests, workRequest])
      setNewWorkRequest({})
    }
  }

  const handleDeleteWorkRequest = (id: string) => {
    setWorkRequests(workRequests.filter((wr) => wr.id !== id))
  }

  const handleUpdateWorkRequestStatus = (id: string, status: WorkRequest["status"]) => {
    setWorkRequests(
      workRequests.map((wr) => (wr.id === id ? { ...wr, status } : wr))
    )
  }

  const getStatusBadgeVariant = (status: Property["status"]) => {
    switch (status) {
      case "rented":
        return "default"
      case "vacant":
        return "secondary"
      case "under_maintenance":
        return "destructive"
      case "sold":
        return "outline"
      default:
        return "default"
    }
  }

  const getWorkRequestStatusBadgeVariant = (status: WorkRequest["status"]) => {
    switch (status) {
      case "new":
        return "default"
      case "in_progress":
        return "secondary"
      case "completed":
        return "outline"
      default:
        return "default"
    }
  }

  // Calculate property health indicators
  const pendingWorkRequests = workRequests.filter(
    (wr) => wr.status === "new" || wr.status === "in_progress"
  ).length

  const hasNegativeCashflow = calculateMonthlyCashflow() < 0
  const needsAttention = hasNegativeCashflow || pendingWorkRequests > 0
  const isHealthy = !needsAttention && calculateMonthlyCashflow() > 0

  // Get work request count for badge
  const workRequestCount = workRequests.length

  // After early return, propertyData is guaranteed to be non-null
  // Use non-null assertion for TypeScript
  const safePropertyData = propertyData!

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/properties")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {safePropertyData.address}
                {needsAttention && (
                  <Star className="h-6 w-6 text-red-500 fill-red-500" />
                )}
                {isHealthy && (
                  <Star className="h-6 w-6 text-green-500 fill-green-500" />
                )}
              </h1>
              <p className="text-muted-foreground">
                {safePropertyData.type} •{" "}
                <Badge variant={getStatusBadgeVariant(safePropertyData.status)}>
                  {safePropertyData.status.replace("_", " ")}
                </Badge>
                {needsAttention && (
                  <span className="ml-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Needs Attention
                  </span>
                )}
                {isHealthy && (
                  <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                    All Good
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <SaveButton onSave={handleSaveProperty} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="rentroll">Rent Roll</TabsTrigger>
          <TabsTrigger value="workrequests" className="relative">
            Work Requests
            {workRequestCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
                {workRequestCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Financial Form */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>
                  Edit property financial details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mortgageHolder">Mortgage Holder</Label>
                  <Input
                    id="mortgageHolder"
                    name="mortgageHolder"
                    value={safePropertyData.mortgageHolder || ""}
                    onChange={(e) =>
                      handlePropertyFieldChange("mortgageHolder", e.target.value)
                    }
                    placeholder="Bank name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    value={safePropertyData.purchasePrice}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "purchasePrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentEstValue">Current Est. Value</Label>
                  <Input
                    id="currentEstValue"
                    name="currentEstValue"
                    type="number"
                    value={safePropertyData.currentEstValue}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "currentEstValue",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyMortgagePayment">
                    Monthly Mortgage Payment
                  </Label>
                  <Input
                    id="monthlyMortgagePayment"
                    name="monthlyMortgagePayment"
                    type="number"
                    value={safePropertyData.monthlyMortgagePayment}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "monthlyMortgagePayment",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyInsurance">Monthly Insurance</Label>
                  <Input
                    id="monthlyInsurance"
                    name="monthlyInsurance"
                    type="number"
                    value={safePropertyData.monthlyInsurance}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "monthlyInsurance",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyPropertyTax">
                    Monthly Property Tax
                  </Label>
                  <Input
                    id="monthlyPropertyTax"
                    name="monthlyPropertyTax"
                    type="number"
                    value={safePropertyData.monthlyPropertyTax}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "monthlyPropertyTax",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyOtherCosts">Monthly Other Costs</Label>
                  <Input
                    id="monthlyOtherCosts"
                    name="monthlyOtherCosts"
                    type="number"
                    value={safePropertyData.monthlyOtherCosts}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "monthlyOtherCosts",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyGrossRent">Monthly Gross Rent</Label>
                  <Input
                    id="monthlyGrossRent"
                    name="monthlyGrossRent"
                    type="number"
                    value={safePropertyData.monthlyGrossRent}
                    onChange={(e) =>
                      handlePropertyFieldChange(
                        "monthlyGrossRent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={safePropertyData.status}
                    onValueChange={(value) =>
                      handlePropertyFieldChange(
                        "status",
                        value as Property["status"]
                      )
                    }
                  >
                    <SelectTrigger id="status" name="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="vacant">Vacant</SelectItem>
                      <SelectItem value="under_maintenance">
                        Under Maintenance
                      </SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="status" value={safePropertyData.status} />
                </div>
              </CardContent>
            </Card>

            {/* Calculated Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Calculated Metrics</CardTitle>
                <CardDescription>
                  Automatically calculated based on financial data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Monthly Total Costs</Label>
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculateMonthlyCosts())}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Monthly Cashflow</Label>
                  <div
                    className={`text-2xl font-bold ${
                      calculateMonthlyCashflow() >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(calculateMonthlyCashflow())}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Annual Cashflow</Label>
                  <div
                    className={`text-2xl font-bold ${
                      calculateAnnualCashflow() >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(calculateAnnualCashflow())}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cap Rate</Label>
                  <div className="text-2xl font-bold">
                    {formatPercentage(calculateCapRate())}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cash-on-Cash Return</Label>
                  <div className="text-2xl font-bold">
                    {formatPercentage(calculateCashOnCashReturn())}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rent Roll Tab */}
        <TabsContent value="rentroll" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rent Roll / Units</CardTitle>
                  <CardDescription>
                    Manage individual units and tenants
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Units Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Name</TableHead>
                      <TableHead>Tenant Name</TableHead>
                      <TableHead className="text-right">Monthly Rent</TableHead>
                      <TableHead>Lease Start</TableHead>
                      <TableHead>Lease End</TableHead>
                      <TableHead className="text-right">
                        Security Deposit
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentRoll.map((unit, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {unit.unitName}
                        </TableCell>
                        <TableCell>{unit.tenantName}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(unit.monthlyRent)}
                        </TableCell>
                        <TableCell>{unit.leaseStart}</TableCell>
                        <TableCell>{unit.leaseEnd}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(unit.securityDeposit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUnit(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rentRoll.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No units added yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Add Unit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Add New Unit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="unitName">Unit Name</Label>
                      <Input
                        id="unitName"
                        name="unitName"
                        value={newUnit.unitName || ""}
                        onChange={(e) =>
                          setNewUnit({ ...newUnit, unitName: e.target.value })
                        }
                        placeholder="e.g., Unit 1A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tenantName">Tenant Name</Label>
                      <Input
                        id="tenantName"
                        name="tenantName"
                        value={newUnit.tenantName || ""}
                        onChange={(e) =>
                          setNewUnit({ ...newUnit, tenantName: e.target.value })
                        }
                        placeholder="Tenant name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyRent">Monthly Rent</Label>
                      <Input
                        id="monthlyRent"
                        name="monthlyRent"
                        type="number"
                        value={newUnit.monthlyRent || ""}
                        onChange={(e) =>
                          setNewUnit({
                            ...newUnit,
                            monthlyRent: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="securityDeposit">Security Deposit</Label>
                      <Input
                        id="securityDeposit"
                        name="securityDeposit"
                        type="number"
                        value={newUnit.securityDeposit || ""}
                        onChange={(e) =>
                          setNewUnit({
                            ...newUnit,
                            securityDeposit: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseStart">Lease Start</Label>
                      <Input
                        id="leaseStart"
                        name="leaseStart"
                        type="date"
                        value={newUnit.leaseStart || ""}
                        onChange={(e) =>
                          setNewUnit({ ...newUnit, leaseStart: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leaseEnd">Lease End</Label>
                      <Input
                        id="leaseEnd"
                        name="leaseEnd"
                        type="date"
                        value={newUnit.leaseEnd || ""}
                        onChange={(e) =>
                          setNewUnit({ ...newUnit, leaseEnd: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddUnit} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Unit
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Requests Tab */}
        <TabsContent value="workrequests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Requests / Maintenance</CardTitle>
              <CardDescription>
                Track maintenance requests and repairs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Work Requests Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Logged</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.dateLogged}</TableCell>
                        <TableCell>{request.description}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getWorkRequestStatusBadgeVariant(
                              request.status
                            )}
                          >
                            {request.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(request.cost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={request.status}
                              onValueChange={(value) =>
                                handleUpdateWorkRequestStatus(
                                  request.id,
                                  value as WorkRequest["status"]
                                )
                              }
                            >
                              <SelectTrigger className="w-32" id={`workRequest-status-${request.id}`} name={`workRequest-status-${request.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <input type="hidden" name={`workRequest-status-${request.id}`} value={request.status} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWorkRequest(request.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {workRequests.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No work requests logged yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Add Work Request Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Log New Work Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dateLogged">Date Logged</Label>
                      <Input
                        id="dateLogged"
                        name="dateLogged"
                        type="date"
                        value={newWorkRequest.dateLogged || ""}
                        onChange={(e) =>
                          setNewWorkRequest({
                            ...newWorkRequest,
                            dateLogged: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workRequestStatus">Status</Label>
                      <Select
                        value={newWorkRequest.status || "new"}
                        onValueChange={(value) =>
                          setNewWorkRequest({
                            ...newWorkRequest,
                            status: value as WorkRequest["status"],
                          })
                        }
                      >
                        <SelectTrigger id="workRequestStatus" name="workRequestStatus">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="workRequestStatus" value={newWorkRequest.status || "new"} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                        value={newWorkRequest.description || ""}
                        onChange={(e) =>
                          setNewWorkRequest({
                            ...newWorkRequest,
                            description: e.target.value,
                          })
                        }
                        placeholder="Describe the maintenance issue or work needed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost</Label>
                      <Input
                        id="cost"
                        name="cost"
                        type="number"
                        value={newWorkRequest.cost || ""}
                        onChange={(e) =>
                          setNewWorkRequest({
                            ...newWorkRequest,
                            cost: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddWorkRequest} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Work Request
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Upload and manage property documents (insurance, tax bills,
                mortgage agreements)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Document Management
                </h3>
                <p className="text-muted-foreground mb-4">
                  Upload PDFs for insurance policies, tax bills, and mortgage
                  agreements
                </p>
                <div className="flex gap-2 justify-center">
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Link External Document
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Note: Document upload functionality will be implemented with
                  file storage integration (e.g., Supabase Storage, AWS S3)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

