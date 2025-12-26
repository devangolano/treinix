"use client"

import Link from "next/link"
import Image from "next/image"
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
import { useAuth } from "@/hooks/use-auth"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    requiredRole: null, // Todos podem ver
  },
  {
    title: "Formações",
    icon: GraduationCap,
    href: "/dashboard/formacoes",
    requiredRole: null, // Todos podem ver
  },
  {
    title: "Alunos",
    icon: Users,
    href: "/dashboard/alunos",
    requiredRole: null, // Todos podem ver
  },
  {
    title: "Turmas",
    icon: Calendar,
    href: "/dashboard/turmas",
    requiredRole: null, // Todos podem ver
  },
  {
    title: "Pagamentos",
    icon: CreditCard,
    href: "/dashboard/pagamentos",
    requiredRole: null, // Todos podem ver
  },
  {
    title: "Usuários",
    icon: UserCog,
    href: "/dashboard/usuarios",
    requiredRole: "centro_admin", // Apenas admin pode ver
  },
  {
    title: "Subscrição",
    icon: FileText,
    href: "/dashboard/subscription",
    requiredRole: null, // Todos podem ver
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  // Filtrar itens do menu baseado na role do usuário
  const visibleMenuItems = menuItems.filter(item => {
    if (item.requiredRole === null) return true
    return user?.role === item.requiredRole
  })

  return (
    <div className="flex h-full flex-col bg-blue-950">
      <div className="flex h-16 items-center gap-2 border-b border-blue-800 px-6">
        <Image src="/logo.png" alt="Treinix Logo" width={120} height={30} className="h-6 w-auto" />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-blue-300 hover:bg-blue-900 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-blue-800 p-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-blue-300 hover:bg-blue-900 hover:text-white" onClick={handleLogout}>
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
      <div className="hidden md:flex h-screen w-64 flex-col border-r border-blue-800 bg-blue-950">
        <SidebarContent />
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-blue-800 bg-blue-950 px-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-orange-400" />
          <span className="text-lg font-bold text-white">Formação-Ao</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-blue-900">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-blue-950 border-blue-800">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
