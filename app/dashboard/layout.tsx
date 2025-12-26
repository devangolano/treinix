import type { ReactNode } from "react"
import { DashboardGuard } from "@/components/dashboard-guard"
import { SubscriptionGuard } from "@/components/subscription-guard"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGuard>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </DashboardGuard>
  )
}
