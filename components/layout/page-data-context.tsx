"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface PageDataContextType {
  pageData: Record<string, any> | null
  setPageData: (data: Record<string, any> | null) => void
}

const PageDataContext = createContext<PageDataContextType | undefined>(undefined)

export function PageDataProvider({ children }: { children: ReactNode }) {
  const [pageData, setPageData] = useState<Record<string, any> | null>(null)

  return (
    <PageDataContext.Provider value={{ pageData, setPageData }}>
      {children}
    </PageDataContext.Provider>
  )
}

export function usePageData() {
  const context = useContext(PageDataContext)
  if (!context) {
    return { pageData: null, setPageData: () => {} }
  }
  return context
}

