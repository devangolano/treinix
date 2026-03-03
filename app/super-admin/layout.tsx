"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { Clock } from "lucide-react"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!user || user.role !== "super_admin") {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-slate-300">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <SuperAdminSidebar />
      <div className="flex-1 overflow-auto pt-16 md:pt-0 md:ml-64">
        {children}
      </div>
    </div>
  )
}
