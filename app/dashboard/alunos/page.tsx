"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService, centroService, matriculaService } from "@/lib/supabase-services"
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
  Search,
  Filter,
  Eye,
  FileText,
  GraduationCap,
  MoreVertical,
} from "lucide-react"
import { generateAlunoPDF } from "@/lib/pdf-generator"
import type { Aluno, Formacao, Turma, Pagamento, Centro } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { Pagination } from "@/components/pagination"

export default function AlunosPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [centro, setCentro] = useState<Centro | null>(null)
  const [matriculas, setMatriculas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [formacaoFilter, setFormacaoFilter] = useState<string>("all")
  const [turmaFilter, setTurmaFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [installmentStats, setInstallmentStats] = useState<Record<string, { paidCount: number; totalCount: number; percentage: number }>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (authLoading) return

    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    loadData(user.centroId)
  }, [user, authLoading, router])

  // Ouvir eventos de pagamento para recarregar dados quando prestações forem pagas em outra página
  useEffect(() => {
    const handler = () => {
      if (user?.centroId) loadData(user.centroId)
    }
    if (typeof window !== "undefined") {
      window.addEventListener("pagamento:updated", handler)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pagamento:updated", handler)
      }
    }
  }, [user])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      setError(null)

      const [alunosData, formacoesData, turmasData, pagamentosData, centroData] = await Promise.all([
        alunoService.getAll(centroId),
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
        pagamentoService.getAll(centroId),
        centroService.getById(centroId),
      ])

      setAlunos(alunosData)
      setFormacoes(formacoesData)
      setTurmas(turmasData)
      setPagamentos(pagamentosData)
      setCentro(centroData)

      // Carregar matrículas para todos os alunos
      try {
        const allMatriculas: any[] = []
        for (const aluno of alunosData) {
          const alunoMatriculas = await matriculaService.getByAlunoId(aluno.id)
          allMatriculas.push(...alunoMatriculas)
        }
        setMatriculas(allMatriculas)
      } catch (error) {
        console.error("Erro ao carregar matrículas:", error)
        setMatriculas([])
      }

      // Calcular stats de prestações para cada pagamento
      const stats: Record<string, { paidCount: number; totalCount: number; percentage: number }> = {}
      for (const pagamento of pagamentosData) {
        try {
          const installments = await pagamentoInstallmentService.getByPagamentoId(pagamento.id)
          const paidCount = installments.filter((i) => i.status === "paid").length
          stats[pagamento.id] = {
            paidCount,
            totalCount: installments.length,
            percentage: installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0,
          }
        } catch (error) {
          console.error(`Erro ao buscar prestações do pagamento ${pagamento.id}:`, error)
          stats[pagamento.id] = { paidCount: 0, totalCount: 0, percentage: 0 }
        }
      }
      setInstallmentStats(stats)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      console.error("Erro ao carregar dados:", err)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAluno = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este aluno?")) return

    try {
      const success = await alunoService.delete(id)
      if (success) {
        setAlunos(alunos.filter((a) => a.id !== id))
        alert("Aluno deletado com sucesso")
      } else {
        alert("Erro ao deletar aluno")
      }
    } catch (err) {
      console.error("Erro ao deletar aluno:", err)
      alert("Erro ao deletar aluno")
    }
  }

  const getPaymentStatus = (alunoId: string) => {
    // Como agora os pagamentos estão vinculados às matrículas,
    // não podemos buscar diretamente pelo aluno ID
    // Isso deve ser feito via matrículas
    return null
  }

  const getStats = (pagamentoId: string) => {
    return installmentStats[pagamentoId] || { paidCount: 0, totalCount: 0, percentage: 0 }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Filtrar alunos baseado em busca e filtros
  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch =
      aluno.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.bi.includes(searchTerm)

    // Verificar se aluno tem matrícula na formação selecionada
    const alunoMatriculas = matriculas.filter((m) => m.alunoId === aluno.id)
    const matchesFormacao =
      formacaoFilter === "all" || alunoMatriculas.some((m) => m.formacaoId === formacaoFilter)

    // Verificar se aluno tem matrícula na turma selecionada
    const matchesTurma = turmaFilter === "all" || alunoMatriculas.some((m) => m.turmaId === turmaFilter)

    return matchesSearch && matchesFormacao && matchesTurma
  })

  // Cálculo de paginação
  const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAlunos = filteredAlunos.slice(startIndex, endIndex)

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, formacaoFilter, turmaFilter])

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return

    try {
      await alunoService.delete(id)
      alert("Aluno excluído com sucesso!")
      if (user?.centroId) loadData(user.centroId)
    } catch (error) {
      alert("Erro ao excluir aluno")
    }
  }

  const handleDownloadFicha = async (aluno: Aluno) => {
    try {
      // Como os pagamentos agora estão vinculados a matrículas,
      // vamos apenas gerar a ficha do aluno sem dados de matrícula
      // O usuário pode acessar a página de detalhes para gerar ficha de matrícula específica

      // Converter método de pagamento para formato legível
      const paymentMethodMap: Record<string, string> = {
        cash: "Dinheiro",
        transfer: "Transferência Bancária",
        multicaixa: "Multicaixa",
      }

      await generateAlunoPDF({
        name: aluno.name,
        email: aluno.email,
        phone: aluno.phone,
        bi: aluno.bi,
        birthDate: aluno.birthDate,
        address: aluno.address,
        status: aluno.status,
        createdAt: aluno.createdAt,
        centroName: centro?.name,
        centroEmail: centro?.email,
        centroPhone: centro?.phone,
        centroAddress: centro?.address,
        systemPhone: "948324028",
      })

      alert(`Ficha de ${aluno.name} baixada com sucesso!`)
    } catch (error) {
      console.error("[AlunosList] Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <CentroSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Alunos</h1>
              <p className="text-blue-200">Gerencie os alunos do seu centro</p>
            </div>

            <Link href="/dashboard/alunos/novo">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            </Link>
          </div>

            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {/* Busca e Filtros - Em linha em telas maiores */}
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Busca */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  {/* Filtros - Grid no mobile, flex no desktop */}
                  <div className="grid grid-cols-2 md:flex gap-2 md:gap-3">
                    <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white text-xs md:text-sm">
                        <SelectValue placeholder="Formação" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        <SelectItem value="all">Todas</SelectItem>
                        {formacoes.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={turmaFilter} onValueChange={setTurmaFilter}>
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white text-xs md:text-sm">
                        <SelectValue placeholder="Turma" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        <SelectItem value="all">Todas</SelectItem>
                        {turmas.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Informação de resultados */}
                <div className="text-xs md:text-sm text-blue-300">
                  {filteredAlunos.length === alunos.length ? (
                    <span>{alunos.length} aluno(s)</span>
                  ) : (
                    <span>
                      {filteredAlunos.length} de {alunos.length}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>

          <Card className="bg-blue-900/30 border-blue-800">
            <CardContent className="pt-6">
              {/* Exibição Desktop - Tabela */}
              <div className="hidden md:block rounded-lg border border-blue-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-800/50">
                    <TableRow className="hover:bg-blue-800/50 border-blue-700">
                      <TableHead className="text-blue-100 font-semibold">Nome</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Email</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Telefone</TableHead>
                      <TableHead className="text-blue-100 font-semibold">BI</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-100 font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlunos.length === 0 ? (
                      <TableRow className="border-blue-700 hover:bg-blue-900/20">
                        <TableCell colSpan={7} className="text-center text-blue-300 py-8">
                          {alunos.length === 0
                            ? "Nenhum aluno cadastrado"
                            : "Nenhum aluno encontrado com os filtros aplicados"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAlunos.map((aluno) => (
                        <TableRow key={aluno.id} className="border-blue-700 hover:bg-blue-900/30 transition-colors">
                          <TableCell className="text-white font-medium">{aluno.name}</TableCell>
                          <TableCell className="text-blue-200">{aluno.email}</TableCell>
                          <TableCell className="text-blue-200">{aluno.phone}</TableCell>
                          <TableCell className="text-blue-200">{aluno.bi}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={aluno.status === "active" ? "default" : "secondary"} 
                              className="bg-orange-500 text-white border-orange-600"
                            >
                              {aluno.status === "active" ? "Ativo" : "Inativo"}
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
                                  <Link href={`/dashboard/alunos/${aluno.id}`} className="flex items-center cursor-pointer text-blue-100">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDownloadFicha(aluno)}
                                  className="hover:bg-blue-800 text-blue-100 cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Baixar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="hover:bg-blue-800">
                                  <Link href={`/dashboard/alunos/${aluno.id}/nova-matricula`} className="flex items-center cursor-pointer text-orange-400">
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    Matricular
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="hover:bg-blue-800">
                                  <Link href={`/dashboard/alunos/${aluno.id}/editar`} className="flex items-center cursor-pointer text-blue-100">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteAluno(aluno.id)}
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
              {filteredAlunos.length > 0 && (
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
                {filteredAlunos.length === 0 ? (
                  <div className="text-center text-blue-300 py-8">
                    {alunos.length === 0
                      ? "Nenhum aluno cadastrado"
                      : "Nenhum aluno encontrado com os filtros aplicados"}
                  </div>
                ) : (
                  paginatedAlunos.map((aluno) => (
                    <Card key={aluno.id} className="bg-blue-800/40 border-blue-700 hover:border-orange-500 transition-colors">
                      <CardContent className="pt-4 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate">{aluno.name}</p>
                              <p className="text-sm text-blue-200 truncate">{aluno.email}</p>
                            </div>
                            <Badge 
                              variant={aluno.status === "active" ? "default" : "secondary"} 
                              className="bg-orange-500 text-white border-orange-600 shrink-0"
                            >
                              {aluno.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>

                          <div className="flex gap-4 text-sm text-blue-300 border-t border-blue-700 pt-2">
                            <div>
                              <p className="text-xs text-blue-400">Telefone</p>
                              <p className="text-blue-200">{aluno.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs text-blue-400">BI</p>
                              <p className="text-blue-200">{aluno.bi}</p>
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
                                  <Link href={`/dashboard/alunos/${aluno.id}`} className="flex items-center cursor-pointer text-blue-100">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDownloadFicha(aluno)}
                                  className="hover:bg-blue-800 text-blue-100 cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="hover:bg-blue-800">
                                  <Link href={`/dashboard/alunos/${aluno.id}/nova-matricula`} className="flex items-center cursor-pointer text-orange-400">
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    Matricular
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="hover:bg-blue-800">
                                  <Link href={`/dashboard/alunos/${aluno.id}/editar`} className="flex items-center cursor-pointer text-blue-100">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteAluno(aluno.id)}
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
              {filteredAlunos.length > 0 && (
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
          </Card>
        </div>
      </div>
    </div>
  )
}
