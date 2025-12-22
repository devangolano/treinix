"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, UserCog, Mail, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { userService } from "@/lib/supabase-services"
import { Spinner } from "@/components/ui/spinner"

interface CentroUser {
  id: string
  centroId: string
  authUserId?: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export default function UsuariosPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [usuarios, setUsuarios] = useState<CentroUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    loadUsuarios(currentUser.centroId)
  }, [currentUser, router])

  const loadUsuarios = async (centroId: string) => {
    try {
      setLoading(true)
      const data = await userService.getByCentroId(centroId)
      setUsuarios(data)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter((usuario: CentroUser) => {
    const matchesSearch =
      searchTerm === "" ||
      usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || usuario.role === roleFilter

    return matchesSearch && matchesRole
  })

  if (!currentUser || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Usuários</h1>
              <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
            </div>

            {currentUser.role === "centro_admin" && (
              <Link href="/dashboard/usuarios/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </Link>
            )}
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-45">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Funções</SelectItem>
                    <SelectItem value="centro_admin">Administrador</SelectItem>
                    <SelectItem value="centro_secretary">Secretário/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredUsuarios.length === usuarios.length ? (
                  <span>{usuarios.length} usuário(s) no total</span>
                ) : (
                  <span>
                    {filteredUsuarios.length} de {usuarios.length} usuário(s) encontrado(s)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredUsuarios.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {usuarios.length === 0
                      ? "Nenhum usuário encontrado"
                      : "Nenhum usuário encontrado com os filtros aplicados"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsuarios.map((usuario) => (
                <Card key={usuario.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <UserCog className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{usuario.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{usuario.email}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Criado em: {usuario.createdAt.toLocaleDateString("pt-AO")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={usuario.role === "centro_admin" ? "default" : "secondary"}
                        className="h-fit shrink-0"
                      >
                        {usuario.role === "centro_admin" ? "Administrador" : "Secretário/a"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
