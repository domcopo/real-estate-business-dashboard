"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Grid3x3, 
  Home, 
  Building2, 
  Briefcase, 
  Globe, 
  CreditCard, 
  Heart, 
  Settings,
  ChevronDown,
  ChevronRight,
  Rocket,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useOrganizationList, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GoHighLevelButtonSidebar } from "./gohighlevel-button-sidebar"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "AI Coach", href: "/ai-coach", icon: Sparkles },
  { title: "Property Management", href: "/properties", icon: Home },
  { title: "Agency Management", href: "/agency", icon: Building2 },
  { title: "Business Hub", href: "/business", icon: Briefcase },
  { title: "Health & Productivity", href: "/health", icon: Heart },
  { title: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  onOpen?: () => void
}

export function Sidebar({ isOpen = false, onClose, onOpen }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useUser()
  const { userMemberships, setActive, isLoaded } = useOrganizationList()
  const [collapsed, setCollapsed] = useState(false)
  
  const organizationList = userMemberships?.data || []

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={onOpen}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-background border shadow-lg"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={cn(
        "flex h-screen w-64 flex-col border-r bg-background transition-all fixed lg:static z-50",
        collapsed && "w-16",
        // Mobile: slide in/out
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <h1 className="text-lg font-semibold">Unified Workspace</h1>
        )}
        <div className="flex items-center gap-2">
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Workspace Switcher */}
      {!collapsed && (
        <div className="border-b p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                {organizationList?.[0]?.organization?.name || "Personal"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setActive?.({ organization: null })}>
                Personal
              </DropdownMenuItem>
              {organizationList?.map(({ organization }) => (
                <DropdownMenuItem
                  key={organization.id}
                  onClick={() => setActive?.({ organization: organization.id })}
                >
                  {organization.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      {!collapsed && user && (
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              {user.imageUrl ? (
                <Image src={user.imageUrl} alt={user.fullName || ""} width={32} height={32} className="h-8 w-8 rounded-full" />
              ) : (
                <span className="text-xs font-medium">
                  {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.fullName || user.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GoHighLevel Button */}
      <div className="border-t p-4">
        <GoHighLevelButtonSidebar collapsed={collapsed} />
      </div>
      </div>
    </>
  )
}


