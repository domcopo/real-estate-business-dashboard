"use client"

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
import { Plus, ArrowUpDown, Edit, Upload, Download, FileText, Star, AlertCircle, Trash2, Check, X } from "lucide-react"
import { SaveButton } from "@/components/ui/save-button"
import { Property } from "@/types"
import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import {
  PropertyField,
  PropertyFieldMapping,
  generateInitialMapping,
  mapCsvRowToProperty,
  validateMapping,
  REQUIRED_FIELDS,
} from "@/lib/csv-import"

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
    ownership: "100% ownership",
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
    ownership: "50% partner",
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
    ownership: "100% ownership",
  },
]

type SortField = "address" | "status" | "currentEstValue" | "purchasePrice" | "monthlyGrossRent" | "monthlyCashflow" | "roe"
type SortDirection = "asc" | "desc"

export default function PropertiesPage() {
  const { user } = useUser()
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  // Load properties from database on mount
  useEffect(() => {
    async function loadProperties() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/properties')
        if (response.ok) {
          const data = await response.json()
          console.log('Loaded properties from database:', data.properties?.length || 0)
          
          // Always set properties from database
          if (data.properties && Array.isArray(data.properties)) {
            const loadedProperties: Property[] = data.properties.map((p: any) => ({
              id: p.id, // Use database ID (UUID)
              address: p.address,
              type: p.type,
              status: p.status,
              mortgageHolder: p.mortgage_holder,
              purchasePrice: parseFloat(p.purchase_price) || 0,
              currentEstValue: parseFloat(p.current_est_value) || 0,
              monthlyMortgagePayment: parseFloat(p.monthly_mortgage_payment) || 0,
              monthlyInsurance: parseFloat(p.monthly_insurance) || 0,
              monthlyPropertyTax: parseFloat(p.monthly_property_tax) || 0,
              monthlyOtherCosts: parseFloat(p.monthly_other_costs) || 0,
              monthlyGrossRent: parseFloat(p.monthly_gross_rent) || 0,
              ownership: p.ownership,
              linkedWebsites: p.linked_websites || [],
              rentRoll: [], // TODO: Load from rent_roll_units table
              workRequests: [], // TODO: Load from work_requests table
            }))
            console.log('Loaded properties from database on mount:', loadedProperties.length)
            setProperties(loadedProperties)
          } else {
            // No properties in database, set empty array
            console.log('No properties in database, setting empty array')
            setProperties([])
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to load properties:', errorData)
          // Don't clear properties on error - might be a temporary issue
          // Only set empty if we're sure there are no properties
          if (properties.length === 0) {
            setProperties([])
          }
        }
      } catch (error) {
        console.error('Failed to load properties:', error)
        // Don't clear properties on error - might be a temporary issue
        // Only set empty if we're sure there are no properties
        if (properties.length === 0) {
          setProperties([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [user])
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<PropertyFieldMapping>({})
  const [importError, setImportError] = useState<string>("")
  const [importSuccess, setImportSuccess] = useState<string>("")
  const [editingCell, setEditingCell] = useState<{ propertyId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>("")
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

  // Handle delete property
  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return
    }

    try {
      // Delete from database first
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove from local state after successful deletion
        setProperties(properties.filter((p) => p.id !== propertyId))
        console.log('Property deleted successfully')
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete property')
      }
    } catch (error: any) {
      console.error('Error deleting property:', error)
      alert(`Failed to delete property: ${error.message || 'Unknown error'}`)
    }
  }

  // Handle inline editing
  const handleCellClick = (propertyId: string, field: string, currentValue: any, rawValue?: any) => {
    // Don't allow editing calculated fields
    if (field === "monthlyCosts" || field === "monthlyCashflow" || field === "roe") {
      return
    }
    
    // Allow editing all other fields including type and mortgageHolder
    
    setEditingCell({ propertyId, field })
    // Use rawValue if provided (for formatted currency/percentage), otherwise use currentValue
    const valueToEdit = rawValue !== undefined ? rawValue : currentValue
    if (typeof valueToEdit === "number") {
      setEditValue(valueToEdit.toString())
    } else {
      setEditValue(String(valueToEdit || ""))
    }
  }

  const handleCellSave = () => {
    if (!editingCell) return

    const { propertyId, field } = editingCell
    const property = properties.find((p) => p.id === propertyId)
    if (!property) return

    const updatedProperties = properties.map((p) => {
      if (p.id === propertyId) {
        const updated = { ...p }
        
        // Handle different field types
        if (field === "status") {
          if (["rented", "vacant", "under_maintenance", "sold"].includes(editValue.toLowerCase())) {
            updated.status = editValue.toLowerCase() as Property["status"]
          }
        } else if (
          [
            "purchasePrice",
            "currentEstValue",
            "monthlyMortgagePayment",
            "monthlyInsurance",
            "monthlyPropertyTax",
            "monthlyOtherCosts",
            "monthlyGrossRent",
          ].includes(field)
        ) {
          const numValue = parseFloat(editValue.replace(/[$,\s]/g, ""))
          if (!isNaN(numValue)) {
            ;(updated as any)[field] = numValue
          }
        } else if (field === "address" || field === "type" || field === "mortgageHolder") {
          ;(updated as any)[field] = editValue
        } else if (field === "ownership") {
          const validOwnership = [
            "100% ownership",
            "50% partner",
            "25% partner",
            "75% partner",
            "33% partner",
            "67% partner",
          ].includes(editValue)
            ? editValue
            : "100% ownership"
          ;(updated as any)[field] = validOwnership
        }
        
        return updated
      }
      return p
    })

    setProperties(updatedProperties)
    setEditingCell(null)
    setEditValue("")
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleSaveProperties = async () => {
    try {
      // Send ALL properties - don't filter them out
      // The API will validate and handle invalid ones
      // This prevents accidentally deleting properties that are filtered out
      console.log('Saving properties:', properties.length, 'total properties in state')
      
      // Log any properties that might be missing required fields (for debugging)
      const invalidProperties = properties.filter((prop: Property) => {
        return !prop.address || !prop.type || !prop.status
      })
      if (invalidProperties.length > 0) {
        console.warn(`⚠️ ${invalidProperties.length} properties missing required fields and will be skipped:`, invalidProperties.map(p => ({
          id: p.id,
          address: p.address || '(empty)',
          type: p.type || '(empty)',
          status: p.status || '(empty)'
        })))
      }
      
      // Log valid properties
      const validProperties = properties.filter((prop: Property) => {
        return prop.address && prop.type && prop.status
      })
      console.log(`✅ ${validProperties.length} properties have all required fields and will be saved`)

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: properties, // Send all properties, not just "valid" ones
          workspaceId: null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Properties saved successfully:', data)
        
        // Reload properties from database to ensure state is in sync
        // Add a small delay to ensure database has processed the save
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
          const reloadResponse = await fetch('/api/properties')
          if (reloadResponse.ok) {
            const reloadData = await reloadResponse.json()
            console.log('Reloaded properties after save:', reloadData.properties?.length || 0)
            
            if (reloadData.properties && Array.isArray(reloadData.properties)) {
              const reloadedProperties: Property[] = reloadData.properties.map((p: any) => ({
                id: p.id, // Use database ID (UUID)
                address: p.address,
                type: p.type,
                status: p.status,
                mortgageHolder: p.mortgage_holder,
                purchasePrice: parseFloat(p.purchase_price) || 0,
                currentEstValue: parseFloat(p.current_est_value) || 0,
                monthlyMortgagePayment: parseFloat(p.monthly_mortgage_payment) || 0,
                monthlyInsurance: parseFloat(p.monthly_insurance) || 0,
                monthlyPropertyTax: parseFloat(p.monthly_property_tax) || 0,
                monthlyOtherCosts: parseFloat(p.monthly_other_costs) || 0,
                monthlyGrossRent: parseFloat(p.monthly_gross_rent) || 0,
                ownership: p.ownership,
                linkedWebsites: p.linked_websites || [],
                rentRoll: [],
                workRequests: [],
              }))
              console.log('Setting reloaded properties:', reloadedProperties.length)
              setProperties(reloadedProperties)
            } else {
              // If no properties returned, keep current state (don't clear)
              console.warn('No properties returned after reload, keeping current state')
              // Don't setProperties([]) - this would clear everything
            }
          } else {
            const errorData = await reloadResponse.json().catch(() => ({}))
            console.error('Failed to reload properties after save:', errorData)
            // Don't clear properties if reload fails - keep current state
          }
        } catch (reloadError) {
          console.error('Failed to reload properties after save:', reloadError)
          // Don't throw - save was successful, just reload failed
          // Keep current properties state - don't clear them
        }
        
        return // Success - SaveButton will show success state
      } else {
        const errorData = await response.json()
        console.error('Save failed:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to save properties')
      }
    } catch (error: any) {
      console.error('Error saving properties:', error)
      throw error // Re-throw so SaveButton can handle it
    }
  }

  // Render editable cell
  const renderEditableCell = (
    propertyId: string,
    field: string,
    displayValue: any,
    rawValue: any,
    isEditable: boolean = true,
    className: string = ""
  ) => {
    const isEditing = editingCell?.propertyId === propertyId && editingCell?.field === field

    if (!isEditable) {
      // Read-only cell (calculated values)
      return <span className={className}>{displayValue}</span>
    }

    if (isEditing) {
      if (field === "status") {
        return (
          <div className="flex items-center gap-1">
            <Select
              value={editValue}
              onValueChange={setEditValue}
              onOpenChange={(open) => {
                if (!open) {
                  // When select closes, save
                  handleCellSave()
                }
              }}
            >
              <SelectTrigger className="h-8 w-32" id={`edit-${propertyId}-${field}`} name={`edit-${propertyId}-${field}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCellSave}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCellCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1">
          <Input
            id={`edit-${propertyId}-${field}`}
            name={`edit-${propertyId}-${field}`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCellSave()
              } else if (e.key === "Escape") {
                handleCellCancel()
              }
            }}
            className="h-8 w-32"
            autoFocus
            type={typeof rawValue === "number" ? "number" : "text"}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCellSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCellCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    }

    return (
      <span
        className={`cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors ${className}`}
        onClick={() => handleCellClick(propertyId, field, displayValue, rawValue)}
        title="Click to edit"
      >
        {displayValue}
      </span>
    )
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
      setImportError("")
      setImportSuccess("")

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

      // Parse CSV rows with proper quote handling
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

      // Extract headers and clean them
      const headers = parsed[0]
        .map((h) => h.replace(/^["']|["']$/g, "").trim())
        .filter((h) => h.length > 0) // Filter out empty headers

      if (headers.length === 0) {
        setImportError("No valid headers found in CSV file")
        return
      }

      // Extract data rows, padding with empty strings if needed
      const data = parsed.slice(1)
        .map((row) => {
          // Pad row to match header length
          const padded = [...row]
          while (padded.length < headers.length) {
            padded.push("")
          }
          return padded.slice(0, headers.length)
        })
        .filter((row) => row.some((cell) => cell && cell.trim().length > 0)) // Filter completely empty rows

      if (data.length === 0) {
        setImportError("No data rows found in CSV file")
        return
      }

      // Check for column count mismatches (warning only)
      const expectedColumns = headers.length
      const invalidRows = data.filter((row) => row.length !== expectedColumns)
      if (invalidRows.length > 0) {
        console.warn(`Warning: ${invalidRows.length} rows have incorrect number of columns`)
      }

      setCsvHeaders(headers)
      setCsvData(data)
      
      // Generate initial mapping using utility function
      const initialMapping = generateInitialMapping(headers)
      setFieldMapping(initialMapping)
      
      setImportDialogOpen(true)
    } catch (error) {
      setImportError(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error("CSV parsing error:", error)
    }
  }

  const handleImport = () => {
    try {
      setImportError("")
      setImportSuccess("")

      // Validate required fields are mapped
      const validation = validateMapping(fieldMapping)
      if (!validation.valid) {
        const missingFields = validation.missingFields
          .map((field) => {
            // Convert camelCase to readable format
            return field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
          })
          .join(", ")
        setImportError(`Your CSV is missing mappings for: ${missingFields}. Please select a column for each required field.`)
        return
      }

      // Validate CSV data structure
      if (!Array.isArray(csvData) || csvData.length === 0) {
        setImportError("No data rows found to import")
        return
      }

      if (!Array.isArray(csvHeaders) || csvHeaders.length === 0) {
        setImportError("No headers found in CSV")
        return
      }

      const importedProperties: Property[] = []
      const errors: string[] = []

      // Process each row safely
      csvData.forEach((row, index) => {
        try {
          // Use utility function to safely map row to property
          const propertyPartial = mapCsvRowToProperty(row, csvHeaders, fieldMapping)

          // Validate required fields
          if (!propertyPartial.address || propertyPartial.address.trim() === "") {
            errors.push(`Row ${index + 2}: Missing required field 'address'`)
            return
          }

          // Create complete property with ID
          const property: Property = {
            id: `imported-${Date.now()}-${index}`,
            address: propertyPartial.address || "",
            type: propertyPartial.type || "",
            status: propertyPartial.status || "vacant",
            mortgageHolder: propertyPartial.mortgageHolder,
            purchasePrice: propertyPartial.purchasePrice || 0,
            currentEstValue: propertyPartial.currentEstValue || 0,
            monthlyMortgagePayment: propertyPartial.monthlyMortgagePayment || 0,
            monthlyInsurance: propertyPartial.monthlyInsurance || 0,
            monthlyPropertyTax: propertyPartial.monthlyPropertyTax || 0,
            monthlyOtherCosts: propertyPartial.monthlyOtherCosts || 0,
            monthlyGrossRent: propertyPartial.monthlyGrossRent || 0,
            rentRoll: propertyPartial.rentRoll || [],
            workRequests: propertyPartial.workRequests || [],
            linkedWebsites: propertyPartial.linkedWebsites,
          }

          importedProperties.push(property)
        } catch (rowError) {
          errors.push(`Row ${index + 2}: ${rowError instanceof Error ? rowError.message : 'Unknown error'}`)
        }
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
      console.error("Import error:", error)
    }
  }

  // Property field options for mapping (no empty string values)
  const propertyFields: { value: PropertyField; label: string }[] = [
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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-muted-foreground">Loading properties...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Property Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Portfolio overview and financial tracking
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SaveButton onSave={handleSaveProperties} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            id="csvFileInput"
            name="csvFileInput"
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
        <Button
          onClick={() => {
            // Add a new property with default values (all required fields filled)
            const newProperty: Property = {
              id: `temp-${Date.now()}`, // Temporary ID until saved
              address: 'New Property', // Default address so it can be saved
              type: 'residential', // Default type so it can be saved
              status: 'vacant', // Valid status
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
            setProperties([...properties, newProperty])
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Filter by status:</span>
        <select
          id="statusFilter"
          name="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm w-full sm:w-auto min-h-[44px]"
        >
          <option value="all">All</option>
          <option value="rented">Rented</option>
          <option value="vacant">Vacant</option>
          <option value="under_maintenance">Under Maintenance</option>
          <option value="sold">Sold</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
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
              <TableHead>Partners</TableHead>
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
              <TableHead className="w-12"></TableHead>
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
                      {renderEditableCell(
                        property.id,
                        "address",
                        property.address,
                        property.address,
                        true,
                        "font-medium"
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingCell?.propertyId === property.id && editingCell?.field === "status" ? (
                      renderEditableCell(property.id, "status", property.status, property.status, true)
                    ) : (
                      <Badge
                        variant={getStatusBadgeVariant(property.status)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleCellClick(property.id, "status", property.status, property.status)}
                      >
                        {property.status.replace("_", " ")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCell?.propertyId === property.id && editingCell?.field === "ownership" ? (
                      <div className="flex items-center gap-1">
                        <Select
                          value={editValue || "100% ownership"}
                          onValueChange={setEditValue}
                          onOpenChange={(open) => {
                            if (!open) {
                              handleCellSave()
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-40" id={`edit-${property.id}-ownership`} name={`edit-${property.id}-ownership`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100% ownership">100% ownership</SelectItem>
                            <SelectItem value="50% partner">50% partner</SelectItem>
                            <SelectItem value="25% partner">25% partner</SelectItem>
                            <SelectItem value="75% partner">75% partner</SelectItem>
                            <SelectItem value="33% partner">33% partner</SelectItem>
                            <SelectItem value="67% partner">67% partner</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCellSave}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCellCancel}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="cursor-pointer hover:bg-muted/50 rounded px-1 transition-colors"
                        onClick={() => handleCellClick(property.id, "ownership", property.ownership || "100% ownership", property.ownership || "100% ownership")}
                        title="Click to edit"
                      >
                        {property.ownership || "100% ownership"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderEditableCell(
                      property.id,
                      "currentEstValue",
                      formatCurrency(property.currentEstValue),
                      property.currentEstValue,
                      true
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderEditableCell(
                      property.id,
                      "purchasePrice",
                      formatCurrency(property.purchasePrice),
                      property.purchasePrice,
                      true
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderEditableCell(
                      property.id,
                      "monthlyGrossRent",
                      formatCurrency(property.monthlyGrossRent),
                      property.monthlyGrossRent,
                      true
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderEditableCell(
                      property.id,
                      "monthlyCosts",
                      formatCurrency(monthlyCosts),
                      monthlyCosts,
                      false
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      monthlyCashflow >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {renderEditableCell(
                      property.id,
                      "monthlyCashflow",
                      formatCurrency(monthlyCashflow),
                      monthlyCashflow,
                      false
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderEditableCell(property.id, "roe", formatPercentage(roe), roe, false)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/properties/${property.id}/details`}>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProperty(property.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={3}>Portfolio Totals</TableCell>
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
                  csvHeaders
                    .filter((h) => h && h.trim() !== "")
                    .map((header, index) => {
                      // Find which PropertyField is mapped to this header
                      const currentMapping = Object.entries(fieldMapping).find(
                        ([_, mappedHeader]) => mappedHeader === header
                      )?.[0] as PropertyField | undefined

                      return (
                        <div key={`${header}-${index}`} className="flex items-center gap-2">
                          <div className="flex-1 text-sm font-medium truncate" title={header}>
                            {header}
                          </div>
                          <div className="text-sm text-muted-foreground">→</div>
                          <Select
                            value={currentMapping || undefined}
                            onValueChange={(value) => {
                              if (value === "__unmapped") {
                                // Remove mapping - find and remove the entry
                                const newMapping = { ...fieldMapping }
                                Object.keys(newMapping).forEach((key) => {
                                  if (newMapping[key as PropertyField] === header) {
                                    delete newMapping[key as PropertyField]
                                  }
                                })
                                setFieldMapping(newMapping)
                              } else {
                                // Set mapping - remove old mapping first if exists
                                const newMapping = { ...fieldMapping }
                                Object.keys(newMapping).forEach((key) => {
                                  if (newMapping[key as PropertyField] === header) {
                                    delete newMapping[key as PropertyField]
                                  }
                                })
                                // Add new mapping
                                newMapping[value as PropertyField] = header
                                setFieldMapping(newMapping)
                              }
                            }}
                          >
                            <SelectTrigger
                              className="w-64"
                              id={`csv-mapping-${header}`}
                              name={`csv-mapping-${header}`}
                            >
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyFields.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="__unmapped">Unmapped / Ignore</SelectItem>
                            </SelectContent>
                          </Select>
                          <input
                            type="hidden"
                            name={`csv-mapping-${header}`}
                            value={currentMapping || ""}
                          />
                        </div>
                      )
                    })
                )}
              </div>
              {(() => {
                const validation = validateMapping(fieldMapping)
                if (!validation.valid && csvHeaders.length > 0) {
                  const missingFields = validation.missingFields
                    .map((field) => {
                      return field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
                    })
                    .join(", ")
                  return (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠️ Please map the following required fields: {missingFields}
                    </p>
                  )
                }
                return null
              })()}
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
                          {csvHeaders.map((header, cellIndex) => (
                            <TableCell key={`${header}-${cellIndex}`} className="text-xs">
                              {row[cellIndex]
                                ? String(row[cellIndex])
                                    .replace(/^["']|["']$/g, "")
                                    .substring(0, 30)
                                : ""}
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
            <Button
              onClick={handleImport}
              disabled={csvData.length === 0 || !validateMapping(fieldMapping).valid}
            >
              Import {csvData.length} Properties
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
