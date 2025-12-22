import type { ReactNode } from "react"
import { SubscriptionGuard } from "@/components/subscription-guard"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SubscriptionGuard>{children}</SubscriptionGuard>
}
