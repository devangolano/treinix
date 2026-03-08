"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pagamentoService, alunoService, turmaService, pagamentoInstallmentService } from "@/lib/supabase-services"
import { toast } from "sonner"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, XCircle, Calendar, Search, Filter, MoreVertical } from "lucide-react"
import type { Pagamento, PagamentoInstallment, Aluno, Turma } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Pagination } from "@/components/pagination"
import { InstallmentsModal } from "@/components/pagamentos/installments-modal"

export default function PagamentosPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [installmentsDialog, setInstallmentsDialog] = useState<{
    open: boolean
    pagamento: Pagamento | null
    installments: PagamentoInstallment[]
  }>({ open: false, pagamento: null, installments: [] })
  const [loading, setLoading] = useState(false)
  const [installmentStats, setInstallmentStats] = useState<Record<string, { paidCount: number; totalCount: number; percentage: number }>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router])

  // Listener para recarregar dados quando um pagamento for criado
  useEffect(() => {
    const handlePagamentoCreated = () => {
      console.log("📢 Evento: pagamento criado, recarregando dados...")
      if (currentUser?.centroId) {
        loadData(currentUser.centroId)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("pagamento:created", handlePagamentoCreated)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pagamento:created", handlePagamentoCreated)
      }
    }
  }, [currentUser])

  const loadData = async (centroId: string) => {
    try {
      const [pagamentosData, alunosData, turmasData] = await Promise.all([
        pagamentoService.getAll(centroId),
        alunoService.getAll(centroId),
        turmaService.getAll(centroId),
      ])
      setPagamentos(pagamentosData)
      setAlunos(alunosData)
      setTurmas(turmasData)
      
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
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    }
  }

  const getAlunoName = (alunoId: string) => {
    return alunos.find((a) => a.id === alunoId)?.name || "Aluno não encontrado"
  }

  const getTurmaName = (turmaId: string) => {
    return turmas.find((t) => t.id === turmaId)?.name || "Turma não encontrada"
  }

  // Obter stats de prestações de um pagamento
  const getStats = (pagamentoId: string) => {
    return installmentStats[pagamentoId] || { paidCount: 0, totalCount: 0, percentage: 0 }
  }

  const handleViewInstallments = async (pagamento: Pagamento) => {
    try {
      const installments = await pagamentoInstallmentService.getByPagamentoId(pagamento.id)
      setInstallmentsDialog({ open: true, pagamento, installments })
    } catch (error) {
      console.error("Erro ao carregar prestações:", error)
      toast.error("Erro ao carregar prestações")
    }
  }

  const handlePayInstallment = async (installmentId: string) => {
    setLoading(true)
    try {
      await pagamentoInstallmentService.markAsPaid(installmentId)
      
      // Atualizar status do pagamento se todas as prestações foram pagas
      if (installmentsDialog.pagamento) {
        const allInstallments = await pagamentoInstallmentService.getByPagamentoId(installmentsDialog.pagamento.id)
        
        const paidCount = allInstallments.filter((i) => i.status === "paid").length
        
        const allPaid = paidCount === allInstallments.length
        
        if (allPaid) {
          const updateResult = await pagamentoService.update(installmentsDialog.pagamento.id, {
            status: "completed",
            installmentsPaid: installmentsDialog.pagamento.installments,
          })
          toast.success("Pagamento completo registrado com sucesso!")
        } else {
          const updateResult = await pagamentoService.update(installmentsDialog.pagamento.id, {
            status: "partial",
            installmentsPaid: paidCount,
          })
          toast.success("Prestação paga com sucesso!")
        }
      }
      
      // Recarregar dados completamente após pagar prestação
      if (currentUser?.centroId) {
        await new Promise((resolve) => setTimeout(resolve, 500)) // Aguardar um pouco para sync do BD
        await loadData(currentUser.centroId)
        
        // Recarregar também o dialog de prestações
        if (installmentsDialog.pagamento) {
          const updatedPagamento = await pagamentoService.getById(installmentsDialog.pagamento.id)
          const installments = await pagamentoInstallmentService.getByPagamentoId(installmentsDialog.pagamento.id)
          if (updatedPagamento) {
            setInstallmentsDialog({ 
              open: true, 
              pagamento: updatedPagamento, 
              installments 
            })
            // notificar outras páginas para recarregar dados
            if (typeof window !== "undefined") window.dispatchEvent(new Event("pagamento:updated"))
          }
        }
      }
    } catch (error) {
      console.error("Erro ao pagar prestação:", error)
      toast.error("Erro ao pagar prestação")
    } finally {
      setLoading(false)
    }
  }

  const handleSignNextInstallment = async () => {
    if (!installmentsDialog.pagamento) return

    setLoading(true)
    try {
      const unpaidInstallments = installmentsDialog.installments.filter((i) => i.status !== "paid")

      if (unpaidInstallments.length === 0) {
        toast.error("Todas as prestações já foram pagas")
        setLoading(false)
        return
      }

      // Assinar a próxima prestação (marcar como paid)
      const nextInstallment = unpaidInstallments[0]
      await pagamentoInstallmentService.markAsPaid(nextInstallment.id)

      // Verificar se todas as prestações foram pagas
      const allInstallments = await pagamentoInstallmentService.getByPagamentoId(installmentsDialog.pagamento.id)
      const allPaid = allInstallments.every((i) => i.status === "paid")
      
      if (allPaid) {
        // Atualizar status para completed
        await pagamentoService.update(installmentsDialog.pagamento.id, {
          status: "completed",
          installmentsPaid: installmentsDialog.pagamento.installments,
        })
        toast.success("Todas as prestações foram pagas! Pagamento completo.")
      } else {
        toast.success("Sucesso")
      }

      if (currentUser?.centroId) {
        await new Promise((resolve) => setTimeout(resolve, 500)) // Aguardar um pouco para sync do BD
        await loadData(currentUser.centroId)
        const updatedPagamento = await pagamentoService.getById(installmentsDialog.pagamento.id)
        const updatedInstallments = await pagamentoInstallmentService.getByPagamentoId(installmentsDialog.pagamento.id)
        if (updatedPagamento) {
          setInstallmentsDialog({ open: true, pagamento: updatedPagamento, installments: updatedInstallments })
            // notificar outras páginas para recarregar dados
            if (typeof window !== "undefined") window.dispatchEvent(new Event("pagamento:updated"))
        }
      }
    } catch (error) {
      console.error("Erro ao assinar próxima prestação:", error)
      toast.error("Erro ao assinar próxima prestação")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "outline", label: "Pendente", icon: AlertCircle },
      partial: { variant: "secondary", label: "Parcial", icon: AlertCircle },
      completed: { variant: "default", label: "Completo", icon: CheckCircle },
      cancelled: { variant: "destructive", label: "Cancelado", icon: XCircle },
    }
    return config[status] || config.pending
  }

  const filterPagamentos = (pagamentosList: Pagamento[]) => {
    return pagamentosList.filter((pagamento) => {
      const alunoName = getAlunoName(pagamento.alunoId)
      const turmaName = getTurmaName(pagamento.turmaId)

      const matchesSearch =
        searchTerm === "" ||
        alunoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turmaName.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesMethod = methodFilter === "all" || pagamento.paymentMethod === methodFilter

      return matchesSearch && matchesMethod
    })
  }

  // Reset página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, methodFilter])

  const pendingPagamentos = filterPagamentos(
    pagamentos.filter((p) => p.status !== "completed" && p.status !== "cancelled"),
  )
  const completedPagamentos = filterPagamentos(pagamentos.filter((p) => p.status === "completed"))
  const allFilteredPagamentos = filterPagamentos(pagamentos)

  // Função para paginar lista
  const paginateList = (list: Pagamento[]) => {
    const totalPages = Math.ceil(list.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return {
      items: list.slice(startIndex, endIndex),
      totalPages,
      totalItems: list.length,
    }
  }

  // Renderizar tabela para cada aba
  const renderPagamentosTable = (pagamentosList: Pagamento[], emptyMessage: string) => {
    const { items: paginatedItems, totalPages, totalItems } = paginateList(pagamentosList)

    return (
      <div className="space-y-4">
        {/* Exibição Desktop - Tabela */}
        <div className="hidden md:block rounded-lg border border-blue-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-blue-800/50">
              <TableRow className="hover:bg-blue-800/50 border-blue-700">
                <TableHead className="text-blue-100 font-semibold">Aluno</TableHead>
                <TableHead className="text-blue-100 font-semibold">Turma</TableHead>
                <TableHead className="text-blue-100 font-semibold">Valor</TableHead>
                <TableHead className="text-blue-100 font-semibold">Prestações</TableHead>
                <TableHead className="text-blue-100 font-semibold">Método</TableHead>
                <TableHead className="text-blue-100 font-semibold">Status</TableHead>
                <TableHead className="text-blue-100 font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow className="border-blue-700 hover:bg-blue-900/20">
                  <TableCell colSpan={7} className="text-center text-blue-300 py-8">
                    {totalItems === 0 ? emptyMessage : "Nenhum pagamento encontrado com os filtros aplicados"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((pagamento) => {
                  const statusConfig = getStatusBadge(pagamento.status)
                  return (
                    <TableRow key={pagamento.id} className="border-blue-700 hover:bg-blue-900/30 transition-colors">
                      <TableCell className="text-white font-medium">{getAlunoName(pagamento.alunoId)}</TableCell>
                      <TableCell className="text-blue-200">{getTurmaName(pagamento.turmaId)}</TableCell>
                      <TableCell className="text-blue-200 font-semibold">{pagamento.amount.toLocaleString("pt-AO")} Kz</TableCell>
                      <TableCell className="text-blue-200">
                        {getStats(pagamento.id).paidCount}/{pagamento.installments}
                      </TableCell>
                      <TableCell className="text-blue-200 capitalize">
                        {pagamento.paymentMethod === "cash"
                          ? "Dinheiro"
                          : pagamento.paymentMethod === "transfer"
                            ? "Transferência"
                            : "Multicaixa"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant} className="bg-orange-500 text-white border-orange-600">
                          {statusConfig.label}
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
                            <DropdownMenuItem 
                              onClick={() => handleViewInstallments(pagamento)}
                              className="hover:bg-blue-800 text-blue-100 cursor-pointer"
                            >
                              Ver Prestações
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Exibição Mobile - Cards */}
        <div className="md:hidden space-y-3">
          {paginatedItems.length === 0 ? (
            <Card className="bg-blue-900/30 border-blue-800">
              <CardContent className="py-8 text-center">
                <p className="text-blue-300">
                  {totalItems === 0 ? emptyMessage : "Nenhum pagamento encontrado com os filtros aplicados"}
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedItems.map((pagamento) => {
              const statusConfig = getStatusBadge(pagamento.status)
              return (
                <Card key={pagamento.id} className="bg-blue-800/40 border-blue-700 hover:border-orange-500 transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{getAlunoName(pagamento.alunoId)}</p>
                          <p className="text-sm text-blue-200 truncate">{getTurmaName(pagamento.turmaId)}</p>
                        </div>
                        <Badge variant={statusConfig.variant} className="bg-orange-500 text-white border-orange-600 shrink-0">
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm border-t border-blue-700 pt-2">
                        <div className="flex justify-between">
                          <p className="text-blue-300">Valor:</p>
                          <p className="text-white font-semibold">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-blue-300">Prestações:</p>
                          <p className="text-white font-semibold">{getStats(pagamento.id).paidCount}/{pagamento.installments}</p>
                        </div>
                        <div className="flex justify-between">
                          <p className="text-blue-300">Método:</p>
                          <p className="text-white capitalize">
                            {pagamento.paymentMethod === "cash"
                              ? "Dinheiro"
                              : pagamento.paymentMethod === "transfer"
                                ? "Transferência"
                                : "Multicaixa"}
                          </p>
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400"
                        onClick={() => handleViewInstallments(pagamento)}
                      >
                        Ver Prestações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Paginação */}
        {totalItems > 0 && (
          <div className="mt-4 border-t border-blue-700 pt-4">
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Pagamentos</h1>
              <p className="text-blue-200">Gerencie pagamentos e prestações</p>
            </div>
          </div>

            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Buscar por aluno ou turma..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-full md:w-45 bg-blue-800/40 border-blue-700 text-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-900 border-blue-800">
                    <SelectItem value="all">Todos Métodos</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="multicaixa">Multicaixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">Todos ({allFilteredPagamentos.length})</TabsTrigger>
              <TabsTrigger value="pending">Pendentes ({pendingPagamentos.length})</TabsTrigger>
              <TabsTrigger value="completed">Completos ({completedPagamentos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {renderPagamentosTable(pendingPagamentos, "Nenhum pagamento pendente")}
            </TabsContent>

            <TabsContent value="completed">
              {renderPagamentosTable(completedPagamentos, "Nenhum pagamento completo")}
            </TabsContent>

            <TabsContent value="all">
              {renderPagamentosTable(allFilteredPagamentos, "Nenhum pagamento cadastrado")}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de Prestações */}
      <InstallmentsModal
        open={installmentsDialog.open}
        onOpenChange={(open) => setInstallmentsDialog({ ...installmentsDialog, open })}
        pagamento={installmentsDialog.pagamento}
        installments={installmentsDialog.installments}
        turmas={turmas}
        alunos={alunos}
        loading={loading}
        onPayInstallment={handlePayInstallment}
        onSignNextInstallment={handleSignNextInstallment}
      />
    </div>
  )
}
