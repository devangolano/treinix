"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, signOut, getCurrentUser, onAuthStateChange } from "@/lib/supabase-auth"
import { formacaoService  } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Formacao } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"
import { Pagination } from "@/components/pagination"

export default function FormacoesPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    loadFormacoes(currentUser.centroId)
  }, [currentUser, router])

  const loadFormacoes = async (centroId: string) => {
    try {
      setLoading(true)
      const data = await formacaoService.getAll(centroId)
      setFormacoes(data)
    } catch (error) {
      console.error("Erro ao carregar formações:", error)
      toast({ title: "Erro ao carregar formações", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta formação?")) return

    try {
      await formacaoService.delete(id)
      toast({ title: "Formação excluída com sucesso!" })
      if (currentUser?.centroId) loadFormacoes(currentUser.centroId)
    } catch (error) {
      toast({ title: "Erro ao excluir formação", variant: "destructive" })
    }
  }

  // Filtrar formações baseado em busca e filtros
  const filteredFormacoes = formacoes.filter((formacao) => {
    const matchesSearch =
      formacao.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formacao.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formacao.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || formacao.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Cálculo de paginação
  const totalPages = Math.ceil(filteredFormacoes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedFormacoes = filteredFormacoes.slice(startIndex, endIndex)

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

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
              <h1 className="text-2xl md:text-3xl font-bold text-white">Formações</h1>
              <p className="text-blue-200">Gerencie os cursos do seu centro</p>
            </div>

            <Link href="/dashboard/formacoes/nova">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Nova Formação
              </Button>
            </Link>
          </div>

            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Buscar por nome, descrição ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-blue-800/40 border-blue-700 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-900 border-blue-800">
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 text-sm text-blue-300">
                {filteredFormacoes.length === formacoes.length ? (
                  <span>{formacoes.length} formação(ões) no total</span>
                ) : (
                  <span>
                    {filteredFormacoes.length} de {formacoes.length} formação(ões) encontrada(s)
                  </span>
                )}
              </div>
            </CardContent>

            <CardContent className="pt-6">
              {/* Exibição Desktop - Tabela */}
              <div className="hidden md:block rounded-lg border border-blue-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-800/50">
                    <TableRow className="hover:bg-blue-800/50 border-blue-700">
                      <TableHead className="text-blue-100 font-semibold">Nome</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Categoria</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Duração</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Preço</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFormacoes.length === 0 ? (
                      <TableRow className="border-blue-700 hover:bg-blue-900/20">
                        <TableCell colSpan={6} className="text-center text-blue-300 py-8">
                          {formacoes.length === 0
                            ? "Nenhuma formação cadastrada"
                            : "Nenhuma formação encontrada com os filtros aplicados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedFormacoes.map((formacao) => (
                        <TableRow key={formacao.id} className="border-blue-700 hover:bg-blue-900/30 transition-colors">
                          <TableCell className="text-white font-medium">{formacao.name}</TableCell>
                          <TableCell className="text-blue-200">{formacao.category}</TableCell>
                          <TableCell className="text-blue-200">{formacao.duration}h</TableCell>
                          <TableCell className="font-semibold text-orange-400">
                            {formacao.price.toLocaleString("pt-AO")} Kz
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={formacao.status === "active" ? "default" : "secondary"} 
                              className="bg-orange-500 text-white border-orange-600"
                            >
                              {formacao.status === "active" ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-blue-800/50 text-blue-200 hover:text-white hover:bg-blue-800">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-blue-900 border-blue-800">
                                <DropdownMenuItem asChild className="hover:bg-blue-800">
                                  <Link href={`/dashboard/formacoes/${formacao.id}/editar`} className="flex items-center cursor-pointer text-blue-100">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(formacao.id)}
                                  className="hover:bg-red-900/30 text-red-400 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação Desktop */}
              {filteredFormacoes.length > 0 && (
                <div className="hidden md:block mt-4 border-t border-blue-700 pt-4">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}

              {/* Exibição Mobile - Cards */}
              <div className="md:hidden space-y-3">
                {filteredFormacoes.length === 0 ? (
                  <div className="text-center text-blue-300 py-8">
                    {formacoes.length === 0
                      ? "Nenhuma formação cadastrada"
                      : "Nenhuma formação encontrada com os filtros aplicados"}
                  </div>
                ) : (
                  paginatedFormacoes.map((formacao) => (
                    <Card key={formacao.id} className="bg-blue-800/40 border-blue-700 hover:border-orange-500 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{formacao.name}</p>
                              <p className="text-sm text-blue-200 truncate">{formacao.description}</p>
                            </div>
                            <Badge 
                              variant={formacao.status === "active" ? "default" : "secondary"} 
                              className="bg-orange-500 text-white border-orange-600 shrink-0"
                            >
                              {formacao.status === "active" ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>

                          <div className="flex gap-4 text-sm text-blue-300 border-t border-blue-700 pt-2">
                            <div>
                              <p className="text-xs text-blue-400">Duração</p>
                              <p className="text-blue-200 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formacao.duration}h
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-400">Preço</p>
                              <p className="text-orange-400 font-semibold">{formacao.price.toLocaleString("pt-AO")} Kz</p>
                            </div>
                          </div>

                          <div className="flex gap-2 border-t border-blue-700 pt-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="flex-1 h-9 bg-blue-800/50 text-blue-200 hover:text-white hover:bg-blue-800">
                                  <MoreVertical className="h-4 w-4 mr-1" />
                                  Menu
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-blue-900 border-blue-800">
                                <DropdownMenuItem asChild className="hover:bg-blue-800">
                                  <Link href={`/dashboard/formacoes/${formacao.id}/editar`} className="flex items-center cursor-pointer text-blue-100">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(formacao.id)}
                                  className="hover:bg-red-900/30 text-red-400 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Deletar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Paginação Mobile */}
              {filteredFormacoes.length > 0 && (
                <div className="md:hidden mt-4 border-t border-blue-700 pt-4">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CardContent>
        </div>
      </div>
    </div>
  )
}
