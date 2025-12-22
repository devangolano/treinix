"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Calendar,
  CreditCard,
  UserCog,
  FileText,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/supabase-auth"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Formações",
    icon: GraduationCap,
    href: "/dashboard/formacoes",
  },
  {
    title: "Alunos",
    icon: Users,
    href: "/dashboard/alunos",
  },
  {
    title: "Turmas",
    icon: Calendar,
    href: "/dashboard/turmas",
  },
  {
    title: "Pagamentos",
    icon: CreditCard,
    href: "/dashboard/pagamentos",
  },
  {
    title: "Usuários",
    icon: UserCog,
    href: "/dashboard/usuarios",
  },
  {
    title: "Subscrição",
    icon: FileText,
    href: "/dashboard/subscription",
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <GraduationCap className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Formação-Ao</span>
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

export function CentroSidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
        <SidebarContent />
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Formação-Ao</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
