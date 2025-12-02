export interface Blop {
  id: string
  x: number
  y: number
  shape: "circle" | "square" | "pill" | "diamond"
  color: string
  content: string
  type: "text" | "link" | "url" | "file" | "image" | "embed"
  tags?: string[]
  connections?: string[]
}

export interface Website {
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
  linkedBlops?: string[]
  subscriptionIds?: string[]
}

export interface Subscription {
  id: string
  name: string
  cost: number
  period: "monthly" | "annual"
  renewalDate: string
  category: string
  website?: string
}

export interface RentRollUnit {
  unitName: string
  tenantName: string
  monthlyRent: number
  leaseStart: string
  leaseEnd: string
  securityDeposit: number
}

export interface WorkRequest {
  id: string
  dateLogged: string
  description: string
  status: "new" | "in_progress" | "completed"
  cost: number
}

export interface Property {
  id: string
  address: string
  type: string
  status: "rented" | "vacant" | "under_maintenance" | "sold"
  // Financial fields
  mortgageHolder?: string
  purchasePrice: number
  currentEstValue: number
  monthlyMortgagePayment: number
  monthlyInsurance: number
  monthlyPropertyTax: number
  monthlyOtherCosts: number
  monthlyGrossRent: number
  // Operational fields
  rentRoll?: RentRollUnit[]
  workRequests?: WorkRequest[]
  linkedWebsites?: string[]
}

export interface Client {
  id: string
  name: string
  status: string
  contacts: number
  websites: number
  tasks: number
}


