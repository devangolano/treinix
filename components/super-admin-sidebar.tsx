"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, FileText, LayoutDashboard, LogOut, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/supabase-auth"
import { useRouter } from "next/navigation"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/super-admin",
  },
  {
    title: "Centros",
    icon: Building2,
    href: "/super-admin/centros",
  },
  {
    title: "Subscrições",
    icon: FileText,
    href: "/super-admin/subscriptions",
  },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Super Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
