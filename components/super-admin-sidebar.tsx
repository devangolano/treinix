"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, FileText, LayoutDashboard, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { signOut } from "@/lib/supabase-auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

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

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleNavigation = () => {
    setOpen(false)
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Image src="/logo.png" alt="Treinix Logo" width={120} height={30} className="h-6 w-auto" />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavigation}
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

export function SuperAdminSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-border md:bg-card">
        <SidebarContent />
      </div>

      {/* Mobile Navigation */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="w-64">
          <SidebarContent />
        </DrawerContent>
      </Drawer>
    </>
  )
}
