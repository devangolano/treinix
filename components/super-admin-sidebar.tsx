"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, FileText, LayoutDashboard, LogOut, Menu, BarChart3, X } from "lucide-react"
import { Button } from "@/components/ui/button"
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleNavigation = () => {
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <Button 
          onClick={handleLogout}
          className="w-full justify-start gap-3 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}

export function SuperAdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-slate-800 md:bg-slate-950 md:fixed md:left-0 md:top-0">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-orange-500" />
          <span className="text-lg font-bold text-white">Treinix</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <nav 
        className={cn(
          "md:hidden fixed top-0 left-0 z-40 h-screen w-64 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <Image src="/logo.png" alt="Treinix Logo" width={120} height={30} className="h-6 w-auto" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-slate-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          <SidebarContent onNavigate={() => setIsOpen(false)} />
        </div>
      </nav>
    </>
  )
}
