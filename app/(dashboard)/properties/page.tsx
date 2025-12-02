"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowUpDown, Edit } from "lucide-react"
import { Property } from "@/types"
import { useState, useMemo, useCallback } from "react"
import Link from "next/link"

// Mock data with new fields
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

type SortField = "address" | "status" | "currentEstValue" | "purchasePrice" | "monthlyGrossRent" | "monthlyCashflow" | "roe"
type SortDirection = "asc" | "desc"

export default function PropertiesPage() {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Calculate monthly total costs
  const calculateMonthlyCosts = useCallback((property: Property): number => {
    return (
      property.monthlyMortgagePayment +
      property.monthlyInsurance +
      property.monthlyPropertyTax +
      property.monthlyOtherCosts
    )
  }, [])

  // Calculate monthly cashflow
  const calculateMonthlyCashflow = useCallback((property: Property): number => {
    return property.monthlyGrossRent - calculateMonthlyCosts(property)
  }, [calculateMonthlyCosts])

  // Calculate Return on Equity (ROE)
  const calculateROE = (property: Property): number => {
    const equity = property.currentEstValue - (property.purchasePrice - (property.purchasePrice * 0.2)) // Assuming 20% down
    const annualCashflow = calculateMonthlyCashflow(property) * 12
    if (equity <= 0) return 0
    return (annualCashflow / equity) * 100
  }

  // Filter properties
  const filteredProperties = useMemo(() => {
    let filtered = mockProperties
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }
    return filtered
  }, [statusFilter])

  // Sort properties
  const sortedProperties = useMemo(() => {
    if (!sortField) return filteredProperties

    const calcCashflow = (p: Property) => p.monthlyGrossRent - (p.monthlyMortgagePayment + p.monthlyInsurance + p.monthlyPropertyTax + p.monthlyOtherCosts)
    const calcROE = (p: Property) => {
      const equity = p.currentEstValue - (p.purchasePrice - (p.purchasePrice * 0.2))
      const annualCashflow = calcCashflow(p) * 12
      if (equity <= 0) return 0
      return (annualCashflow / equity) * 100
    }

    return [...filteredProperties].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortField) {
        case "address":
          aValue = a.address
          bValue = b.address
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "currentEstValue":
          aValue = a.currentEstValue
          bValue = b.currentEstValue
          break
        case "purchasePrice":
          aValue = a.purchasePrice
          bValue = b.purchasePrice
          break
        case "monthlyGrossRent":
          aValue = a.monthlyGrossRent
          bValue = b.monthlyGrossRent
          break
        case "monthlyCashflow":
          aValue = calcCashflow(a)
          bValue = calcCashflow(b)
          break
        case "roe":
          aValue = calcROE(a)
          bValue = calcROE(b)
          break
        default:
          return 0
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
  }, [filteredProperties, sortField, sortDirection])

  // Portfolio totals
  const portfolioTotals = useMemo(() => {
    const totalProperties = sortedProperties.length
    const totalEstValue = sortedProperties.reduce(
      (sum, p) => sum + p.currentEstValue,
      0
    )
    const totalMonthlyCashflow = sortedProperties.reduce(
      (sum, p) => sum + calculateMonthlyCashflow(p),
      0
    )
    return { totalProperties, totalEstValue, totalMonthlyCashflow }
  }, [sortedProperties, calculateMonthlyCashflow])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Property Management
          </h1>
          <p className="text-muted-foreground">
            Portfolio overview and financial tracking
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter by status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1 border rounded-md text-sm"
        >
          <option value="all">All</option>
          <option value="rented">Rented</option>
          <option value="vacant">Vacant</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("address")}
              >
                <div className="flex items-center gap-2">
                  Address
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-2">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort("currentEstValue")}
              >
                <div className="flex items-center justify-end gap-2">
                  Est. Value
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort("purchasePrice")}
              >
                <div className="flex items-center justify-end gap-2">
                  Purchase Price
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort("monthlyGrossRent")}
              >
                <div className="flex items-center justify-end gap-2">
                  Gross Rent
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Total Costs</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort("monthlyCashflow")}
              >
                <div className="flex items-center justify-end gap-2">
                  Cashflow
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 text-right"
                onClick={() => handleSort("roe")}
              >
                <div className="flex items-center justify-end gap-2">
                  ROE
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProperties.map((property) => {
              const monthlyCosts = calculateMonthlyCosts(property)
              const monthlyCashflow = calculateMonthlyCashflow(property)
              const roe = calculateROE(property)

              return (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    {property.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(property.status)}>
                      {property.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(property.currentEstValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(property.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(property.monthlyGrossRent)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(monthlyCosts)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      monthlyCashflow >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatCurrency(monthlyCashflow)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(roe)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/properties/${property.id}/details`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={2}>Portfolio Totals</TableCell>
              <TableCell className="text-right">
                {portfolioTotals.totalProperties} Properties
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(portfolioTotals.totalEstValue)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell
                className={`text-right ${
                  portfolioTotals.totalMonthlyCashflow >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatCurrency(portfolioTotals.totalMonthlyCashflow)}
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}
