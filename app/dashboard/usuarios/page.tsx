"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, UserCog, Mail, Search, Filter, Trash2, Edit2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { userService } from "@/lib/supabase-services"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [usuarioADeletar, setUsuarioADeletar] = useState<CentroUser | null>(null)
  const [deletando, setDeletando] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    
    // Verificar se o usuário é admin, caso contrário redirecionar
    if (currentUser.role !== "centro_admin") {
      router.push("/dashboard")
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

  const handleDeleteUsuario = async (usuarioId: string) => {
    const usuario = usuarios.find(u => u.id === usuarioId)
    if (usuario) {
      abrirDialogoDelete(usuario)
    }
  }

  const handleConfirmDelete = async () => {
    if (!usuarioADeletar) return

    try {
      setDeletando(true)
      const success = await userService.delete(usuarioADeletar.id)
      if (success) {
        toast({
          title: "Usuário deletado com sucesso!",
          description: "O usuário foi removido do sistema.",
        })
        setDeleteDialogOpen(false)
        setUsuarioADeletar(null)
        // Recarregar a lista de usuários
        if (currentUser?.centroId) {
          await loadUsuarios(currentUser.centroId)
        }
      } else {
        toast({
          title: "Erro ao deletar usuário",
          description: "Não foi possível deletar o usuário.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      toast({
        title: "Erro ao deletar usuário",
        description: "Ocorreu um erro ao tentar deletar o usuário.",
        variant: "destructive",
      })
    } finally {
      setDeletando(false)
    }
  }

  const abrirDialogoDelete = (usuario: CentroUser) => {
    setUsuarioADeletar(usuario)
    setDeleteDialogOpen(true)
  }

  if (!currentUser || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Usuários</h1>
              <p className="text-blue-200">Gerencie os usuários do sistema</p>
            </div>

            {currentUser.role === "centro_admin" && (
              <Link href="/dashboard/usuarios/novo">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </Link>
            )}
          </div>

          <Card className="mb-6 bg-blue-900/30 border-blue-800">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-45 bg-blue-800/40 border-blue-700 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-900 border-blue-800">
                    <SelectItem value="all">Todas Funções</SelectItem>
                    <SelectItem value="centro_admin">Administrador</SelectItem>
                    <SelectItem value="centro_secretary">Secretário/a</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4 text-sm text-blue-300">
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

          <div className="space-y-2">
            {filteredUsuarios.length === 0 ? (
              <Card className="bg-blue-900/30 border-blue-800">
                <CardContent className="py-12 text-center">
                  <p className="text-blue-300">
                    {usuarios.length === 0
                      ? "Nenhum usuário encontrado"
                      : "Nenhum usuário encontrado com os filtros aplicados"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsuarios.map((usuario) => (
                <Card key={usuario.id} className="hover:shadow-md transition-shadow bg-blue-900/30 border-blue-800 hover:border-orange-500">
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/20">
                          <UserCog className="h-5 w-5 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-white truncate">{usuario.name}</h3>
                          <p className="text-xs text-blue-300 truncate">{usuario.email}</p>
                        </div>
                        <Badge
                          variant={usuario.role === "centro_admin" ? "default" : "secondary"}
                          className="shrink-0 bg-orange-500 text-white border-orange-600 text-xs"
                        >
                          {usuario.role === "centro_admin" ? "Admin" : "Sec"}
                        </Badge>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-700 text-blue-300 hover:bg-blue-900 hover:text-white"
                          onClick={() => router.push(`/dashboard/usuarios/editar?id=${usuario.id}`)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-700/50 text-red-300 hover:bg-red-900/20 hover:text-red-200 hover:border-red-600"
                          onClick={() => handleDeleteUsuario(usuario.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Confirmação para Deletar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-blue-950 border-blue-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deletar Usuário</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-200">
              Tem certeza que deseja deletar o usuário <span className="font-semibold text-white">"{usuarioADeletar?.name}"</span>? 
              <br />
              <span className="text-xs text-red-400 mt-2 inline-block">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-blue-700 text-blue-200 hover:bg-blue-900 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletando ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
