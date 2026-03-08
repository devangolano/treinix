"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { turmaService, formacaoService, alunoService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Pencil, Trash2, Calendar, UsersIcon, Clock, Search, Filter, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import type { Turma, Formacao } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"
import { Pagination } from "@/components/pagination"
import { useConfirm } from "@/hooks/use-confirm"
import { ConfirmDialog } from "@/components/confirm-dialog"

export default function TurmasPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { openConfirm, open, options, handleConfirm, handleCancel } = useConfirm()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
    loadAlunos(currentUser.centroId)
  }, [currentUser, router])

  // Recarregar quando um aluno for cadastrado ou pagamento atualizado
  useEffect(() => {
    const handler = () => {
      if (currentUser?.centroId) {
        loadAlunos(currentUser.centroId)
        loadData(currentUser.centroId)
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pagamento:updated", handler)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pagamento:updated", handler)
      }
    }
  }, [currentUser])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      const [turmasData, formacoesData] = await Promise.all([
        turmaService.getAll(centroId),
        formacaoService.getAll(centroId),
      ])
      setTurmas(turmasData)
      setFormacoes(formacoesData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const loadAlunos = async (centroId: string) => {
    try {
      const alunosData = await alunoService.getAll(centroId)
      setAlunos(alunosData)
    } catch (error) {
      console.error("Erro ao carregar alunos:", error)
    }
  }

  const getFormacaoName = (formacaoId: string) => {
    return formacoes.find((f) => f.id === formacaoId)?.name || "Formação não encontrada"
  }

  const getAlunosPorTurma = (turmaId: string) => {
    return alunos.filter((a) => a.turmaId === turmaId).length
  }

  const handleDelete = async (id: string) => {
    const confirmed = await openConfirm({
      title: "Excluir turma?",
      description: "Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.",
      confirmText: "Deletar",
      isDangerous: true,
    })

    if (!confirmed) return

    try {
      await turmaService.delete(id)
      toast.success("Turma excluída com sucesso!")
      if (currentUser?.centroId) loadData(currentUser.centroId)
    } catch (error) {
      toast.error("Erro ao excluir turma")
    }
  }

  // Filtrar turmas baseado em busca e filtros
  const filteredTurmas = turmas.filter((turma) => {
    const matchesSearch =
      turma.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFormacao = statusFilter === "all" || turma.formacaoId === statusFilter

    return matchesSearch && matchesFormacao
  })

  // Cálculo de paginação
  const totalPages = Math.ceil(filteredTurmas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTurmas = filteredTurmas.slice(startIndex, endIndex)

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
              <h1 className="text-2xl md:text-3xl font-bold text-white">Turmas</h1>
              <p className="text-blue-200">Gerencie as turmas do seu centro</p>
            </div>

            <Link href="/dashboard/turmas/nova">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </Link>
          </div>

            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Buscar por nome da turma..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-blue-800/40 border-blue-700 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Formação" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-900 border-blue-800">
                    <SelectItem value="all">Todas Formações</SelectItem>
                    {formacoes.map((formacao) => (
                      <SelectItem key={formacao.id} value={formacao.id}>
                        {formacao.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 text-sm text-blue-300">
                {filteredTurmas.length === turmas.length ? (
                  <span>{turmas.length} turma(s) no total</span>
                ) : (
                  <span>
                    {filteredTurmas.length} de {turmas.length} turma(s) encontrada(s)
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
                      <TableHead className="text-blue-100 font-semibold">Formação</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Horário</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Alunos</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTurmas.length === 0 ? (
                      <TableRow className="border-blue-700 hover:bg-blue-900/20">
                        <TableCell colSpan={5} className="text-center text-blue-300 py-8">
                          {turmas.length === 0
                            ? "Nenhuma turma cadastrada"
                            : "Nenhuma turma encontrada com os filtros aplicados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTurmas.map((turma) => (
                        <TableRow key={turma.id} className="border-blue-700 hover:bg-blue-900/30 transition-colors">
                          <TableCell className="text-white font-medium">{turma.name}</TableCell>
                          <TableCell className="text-blue-200">{getFormacaoName(turma.formacaoId)}</TableCell>
                          <TableCell className="text-blue-200">{turma.schedule}</TableCell>
                          <TableCell className="text-blue-200">
                            {getAlunosPorTurma(turma.id)}/{turma.maxStudents}
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
                                  <Link href={`/dashboard/turmas/${turma.id}/editar`} className="flex items-center cursor-pointer text-blue-100">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(turma.id)}
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
              {filteredTurmas.length > 0 && (
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
                {filteredTurmas.length === 0 ? (
                  <div className="text-center text-blue-300 py-8">
                    {turmas.length === 0
                      ? "Nenhuma turma cadastrada"
                      : "Nenhuma turma encontrada com os filtros aplicados"}
                  </div>
                ) : (
                  paginatedTurmas.map((turma) => (
                    <Card key={turma.id} className="bg-blue-800/40 border-blue-700 hover:border-orange-500 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{turma.name}</p>
                              <p className="text-sm text-blue-200 truncate">{getFormacaoName(turma.formacaoId)}</p>
                            </div>
                          </div>

                          <div className="flex gap-4 text-sm text-blue-300 border-t border-blue-700 pt-2">
                            <div>
                              <p className="text-xs text-blue-400">Horário</p>
                              <p className="text-blue-200 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {turma.schedule}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-400">Alunos</p>
                              <p className="text-blue-200 flex items-center gap-1">
                                <UsersIcon className="h-3 w-3" />
                                {getAlunosPorTurma(turma.id)}/{turma.maxStudents}
                              </p>
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
                                  <Link href={`/dashboard/turmas/${turma.id}/editar`} className="flex items-center cursor-pointer text-blue-100">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(turma.id)}
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
              {filteredTurmas.length > 0 && (
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

      <ConfirmDialog
        open={open}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText || "Deletar"}
        cancelText={options.cancelText || "Cancelar"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDangerous={options.isDangerous}
      />
    </div>
  )
}
