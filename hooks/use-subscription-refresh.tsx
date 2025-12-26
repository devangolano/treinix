"use client"

import { createContext, useContext, useCallback, useRef } from "react"

interface SubscriptionRefreshContextType {
  triggerRefresh: () => void
  onRefreshTriggered: (callback: () => void) => () => void
}

const SubscriptionRefreshContext = createContext<SubscriptionRefreshContextType | undefined>(undefined)

export function SubscriptionRefreshProvider({ children }: { children: React.ReactNode }) {
  const callbacksRef = useRef<Set<() => void>>(new Set())

  const triggerRefresh = useCallback(() => {
    console.log("[SubscriptionRefresh] Disparando refresh de subscrição")
    callbacksRef.current.forEach((callback) => {
      try {
        callback()
      } catch (error) {
        console.error("[SubscriptionRefresh] Erro ao executar callback:", error)
      }
    })
  }, [])

  const onRefreshTriggered = useCallback((callback: () => void) => {
    callbacksRef.current.add(callback)
    return () => {
      callbacksRef.current.delete(callback)
    }
  }, [])

  return (
    <SubscriptionRefreshContext.Provider value={{ triggerRefresh, onRefreshTriggered }}>
      {children}
    </SubscriptionRefreshContext.Provider>
  )
}

export function useSubscriptionRefresh() {
  const context = useContext(SubscriptionRefreshContext)
  if (context === undefined) {
    throw new Error("useSubscriptionRefresh must be used within SubscriptionRefreshProvider")
  }
  return context
}
