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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, ArrowUpDown, Edit, Upload, Download, FileText, Star, AlertCircle } from "lucide-react"
import { Property } from "@/types"
import { useState, useMemo, useCallback, useRef } from "react"
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
  const [properties, setProperties] = useState<Property[]>(mockProperties)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [importError, setImportError] = useState<string>("")
  const [importSuccess, setImportSuccess] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    let filtered = properties
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }
    return filtered
  }, [properties, statusFilter])

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

  // Export functions
  const exportToCSV = () => {
    const headers = [
      "Address",
      "Type",
      "Status",
      "Mortgage Holder",
      "Purchase Price",
      "Current Est. Value",
      "Monthly Mortgage Payment",
      "Monthly Insurance",
      "Monthly Property Tax",
      "Monthly Other Costs",
      "Monthly Gross Rent",
    ]

    const rows = properties.map((p) => [
      p.address,
      p.type,
      p.status,
      p.mortgageHolder || "",
      p.purchasePrice.toString(),
      p.currentEstValue.toString(),
      p.monthlyMortgagePayment.toString(),
      p.monthlyInsurance.toString(),
      p.monthlyPropertyTax.toString(),
      p.monthlyOtherCosts.toString(),
      p.monthlyGrossRent.toString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `properties_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(properties, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `properties_export_${new Date().toISOString().split("T")[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadSampleCSV = () => {
    const sampleHeaders = [
      "Address",
      "Type",
      "Status",
      "Mortgage Holder",
      "Purchase Price",
      "Current Est. Value",
      "Monthly Mortgage Payment",
      "Monthly Insurance",
      "Monthly Property Tax",
      "Monthly Other Costs",
      "Monthly Gross Rent",
    ]
    
    const sampleData = [
      [
        "123 Sample St, City, State",
        "House",
        "rented",
        "Sample Bank",
        "500000",
        "550000",
        "2500",
        "150",
        "600",
        "200",
        "3500",
      ],
    ]

    const csvContent = [sampleHeaders, ...sampleData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "sample_properties_import.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Import functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset errors
    setImportError("")
    setImportSuccess("")

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setImportError("Please upload a CSV or TXT file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (!text || text.trim().length === 0) {
          setImportError("File is empty")
          return
        }
        parseCSV(text)
      } catch (error) {
        setImportError(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    reader.onerror = () => {
      setImportError("Error reading file. Please try again.")
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    try {
      // Handle different line endings (Windows \r\n, Mac \r, Unix \n)
      const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      const lines = normalizedText.split("\n").filter((line) => line.trim().length > 0)
      
      if (lines.length === 0) {
        setImportError("CSV file appears to be empty")
        return
      }

      if (lines.length < 2) {
        setImportError("CSV file must have at least a header row and one data row")
        return
      }

      const parsed = lines.map((line) => {
        const result: string[] = []
        let current = ""
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          const nextChar = i < line.length - 1 ? line[i + 1] : null
          
          if (char === '"') {
            // Handle escaped quotes ("")
            if (nextChar === '"') {
              current += '"'
              i++ // Skip next quote
            } else {
              inQuotes = !inQuotes
            }
          } else if (char === "," && !inQuotes) {
            result.push(current.trim())
            current = ""
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      })

      const headers = parsed[0].map((h) => h.replace(/^["']|["']$/g, "").trim())
      const data = parsed.slice(1).filter((row) => row.some((cell) => cell.trim().length > 0))

      if (headers.length === 0) {
        setImportError("No headers found in CSV file")
        return
      }

      // Check if all rows have the same number of columns
      const expectedColumns = headers.length
      const invalidRows = data.filter((row) => row.length !== expectedColumns)
      if (invalidRows.length > 0) {
        console.warn(`Warning: ${invalidRows.length} rows have incorrect number of columns`)
      }

      setCsvHeaders(headers)
      setCsvData(data)
      
      // Auto-map fields based on header names
      const autoMapping: Record<string, string> = {}
      const propertyFields = [
        "address",
        "type",
        "status",
        "mortgageHolder",
        "purchasePrice",
        "currentEstValue",
        "monthlyMortgagePayment",
        "monthlyInsurance",
        "monthlyPropertyTax",
        "monthlyOtherCosts",
        "monthlyGrossRent",
      ]

      headers.forEach((header) => {
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
        const matchedField = propertyFields.find((field) => {
          const normalizedField = field.replace(/([A-Z])/g, " $1").toLowerCase().trim().replace(/\s+/g, "")
          const fieldVariations = [
            normalizedField,
            field.toLowerCase(),
            field.replace(/([A-Z])/g, " $1").toLowerCase().trim(),
          ]
          
          return (
            normalizedHeader === normalizedField ||
            normalizedHeader.includes(normalizedField) ||
            normalizedField.includes(normalizedHeader) ||
            fieldVariations.some(v => normalizedHeader.includes(v) || v.includes(normalizedHeader)) ||
            header.toLowerCase().includes(field.toLowerCase()) ||
            field.toLowerCase().includes(header.toLowerCase())
          )
        })
        if (matchedField) {
          autoMapping[header] = matchedField
        }
      })

      setFieldMapping(autoMapping)
      setImportDialogOpen(true)
      setImportError("")
    } catch (error) {
      setImportError(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleImport = () => {
    try {
      setImportError("")
      setImportSuccess("")

      // Validate that at least address is mapped
      const addressMapped = Object.values(fieldMapping).includes("address")
      if (!addressMapped) {
        setImportError("Please map at least the 'Address' field to import properties")
        return
      }

      const importedProperties: Property[] = []
      const errors: string[] = []

      csvData.forEach((row, index) => {
        const property: Partial<Property> = {
          id: `imported-${Date.now()}-${index}`,
          address: "",
          type: "",
          status: "vacant",
          purchasePrice: 0,
          currentEstValue: 0,
          monthlyMortgagePayment: 0,
          monthlyInsurance: 0,
          monthlyPropertyTax: 0,
          monthlyOtherCosts: 0,
          monthlyGrossRent: 0,
          rentRoll: [],
          workRequests: [],
        }

        csvHeaders.forEach((header, colIndex) => {
          const mappedField = fieldMapping[header]
          if (mappedField && mappedField !== "" && row[colIndex] !== undefined) {
            let value = row[colIndex]?.replace(/^["']|["']$/g, "").trim() || ""
            
            if (!value) return // Skip empty values
            
            if (mappedField === "status") {
              const statusValue = value.toLowerCase().trim()
              // More flexible status matching
              const statusMap: Record<string, Property["status"]> = {
                "rented": "rented",
                "rent": "rented",
                "occupied": "rented",
                "vacant": "vacant",
                "vacancy": "vacant",
                "empty": "vacant",
                "under_maintenance": "under_maintenance",
                "maintenance": "under_maintenance",
                "repair": "under_maintenance",
                "sold": "sold",
                "sale": "sold",
              }
              property[mappedField] = statusMap[statusValue] || "vacant"
            } else if (
              [
                "purchasePrice",
                "currentEstValue",
                "monthlyMortgagePayment",
                "monthlyInsurance",
                "monthlyPropertyTax",
                "monthlyOtherCosts",
                "monthlyGrossRent",
              ].includes(mappedField)
            ) {
              // Remove currency symbols, commas, and whitespace
              const cleanedValue = value.replace(/[$,\s]/g, "")
              const numValue = parseFloat(cleanedValue)
              if (!isNaN(numValue) && isFinite(numValue)) {
                property[mappedField as keyof Property] = numValue as any
              } else {
                errors.push(`Row ${index + 1}: Invalid number for ${mappedField}: "${value}"`)
              }
            } else {
              property[mappedField as keyof Property] = value as any
            }
          }
        })

        // Validate required fields
        if (!property.address || property.address.trim() === "") {
          errors.push(`Row ${index + 1}: Missing required field 'address'`)
          return
        }

        importedProperties.push(property as Property)
      })

      if (errors.length > 0 && importedProperties.length === 0) {
        setImportError(`Import failed:\n${errors.slice(0, 5).join("\n")}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ""}`)
        return
      }

      if (importedProperties.length === 0) {
        setImportError("No valid properties found to import. Please check your CSV data and field mapping.")
        return
      }

      setProperties([...properties, ...importedProperties])
      setImportSuccess(`Successfully imported ${importedProperties.length} properties!${errors.length > 0 ? ` (${errors.length} warnings)` : ""}`)
      
      // Clear form after a delay
      setTimeout(() => {
        setImportDialogOpen(false)
        setCsvData([])
        setCsvHeaders([])
        setFieldMapping({})
        setImportError("")
        setImportSuccess("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 2000)
    } catch (error) {
      setImportError(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const propertyFields = [
    { value: "", label: "Skip this column" },
    { value: "address", label: "Address" },
    { value: "type", label: "Type" },
    { value: "status", label: "Status" },
    { value: "mortgageHolder", label: "Mortgage Holder" },
    { value: "purchasePrice", label: "Purchase Price" },
    { value: "currentEstValue", label: "Current Est. Value" },
    { value: "monthlyMortgagePayment", label: "Monthly Mortgage Payment" },
    { value: "monthlyInsurance", label: "Monthly Insurance" },
    { value: "monthlyPropertyTax", label: "Monthly Property Tax" },
    { value: "monthlyOtherCosts", label: "Monthly Other Costs" },
    { value: "monthlyGrossRent", label: "Monthly Gross Rent" },
  ]

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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToJSON}>
            <FileText className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
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
              
              // Check if property needs attention
              const pendingWorkRequests = property.workRequests?.filter(
                (wr) => wr.status === "new" || wr.status === "in_progress"
              ).length || 0
              const hasNegativeCashflow = monthlyCashflow < 0
              const needsAttention = hasNegativeCashflow || pendingWorkRequests > 0
              const isHealthy = !needsAttention && monthlyCashflow > 0

              return (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {needsAttention && (
                        <span title="Needs Attention">
                          <Star className="h-4 w-4 text-red-500 fill-red-500" />
                        </span>
                      )}
                      {isHealthy && (
                        <span title="All Good">
                          <Star className="h-4 w-4 text-green-500 fill-green-500" />
                        </span>
                      )}
                      {property.address}
                    </div>
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Properties from CSV</DialogTitle>
            <DialogDescription>
              Map CSV columns to property fields. You can preview the first few rows below.
              <Button
                variant="link"
                className="p-0 h-auto text-primary ml-2"
                onClick={downloadSampleCSV}
              >
                Download sample CSV
              </Button>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Error Message */}
            {importError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">{importError}</p>
              </div>
            )}
            
            {/* Success Message */}
            {importSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">{importSuccess}</p>
              </div>
            )}
            {/* Field Mapping */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Field Mapping</Label>
                <span className="text-xs text-muted-foreground">
                  {csvHeaders.length} columns detected
                </span>
              </div>
              <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                {csvHeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No headers detected. Please check your CSV file format.
                  </p>
                ) : (
                  csvHeaders.map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 text-sm font-medium truncate" title={header}>
                        {header}
                      </div>
                      <div className="text-sm text-muted-foreground">→</div>
                      <Select
                        value={fieldMapping[header] || ""}
                        onValueChange={(value) =>
                          setFieldMapping({ ...fieldMapping, [header]: value })
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyFields.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                )}
              </div>
              {!Object.values(fieldMapping).includes("address") && csvHeaders.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Please map at least the "Address" field to import properties
                </p>
              )}
            </div>

            {/* Preview */}
            {csvData.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 3 rows)</Label>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvHeaders.map((header, index) => (
                          <TableHead key={index} className="text-xs">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 3).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex} className="text-xs">
                              {cell.replace(/^"|"$/g, "").substring(0, 30)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={csvData.length === 0}>
              Import {csvData.length} Properties
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
