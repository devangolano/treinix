"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { pagamentoService, alunoService, turmaService, pagamentoInstallmentService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertCircle, XCircle, Calendar, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Pagamento, PagamentoInstallment, Aluno, Turma } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { Progress } from "@/components/ui/progress"

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
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router])

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
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
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
      toast({ title: "Erro ao carregar prestações", variant: "destructive" })
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
          toast({ title: "Pagamento completo registrado com sucesso!" })
        } else {
          const updateResult = await pagamentoService.update(installmentsDialog.pagamento.id, {
            status: "partial",
            installmentsPaid: paidCount,
          })
          toast({ title: "Prestação paga com sucesso!" })
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
      toast({ title: "Erro ao pagar prestação", variant: "destructive" })
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
        toast({ title: "Todas as prestações já foram pagas", variant: "default" })
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
        toast({ title: "Todas as prestações foram pagas! Pagamento completo." })
      } else {
        toast({ title: `Prestação ${nextInstallment.installmentNumber} assinada com sucesso!` })
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
      toast({ title: "Erro ao assinar próxima prestação", variant: "destructive" })
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

  const pendingPagamentos = filterPagamentos(
    pagamentos.filter((p) => p.status !== "completed" && p.status !== "cancelled"),
  )
  const vistaCompletedPagamentos = filterPagamentos(
    pagamentos.filter((p) => p.status === "completed" && p.paymentMethod === "cash"),
  )
  const otherCompletedPagamentos = filterPagamentos(
    pagamentos.filter((p) => p.status === "completed" && p.paymentMethod !== "cash"),
  )
  const completedPagamentos = filterPagamentos(pagamentos.filter((p) => p.status === "completed"))
  const allFilteredPagamentos = filterPagamentos(pagamentos)

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

          <Card className="mb-6 bg-blue-900/30 border-blue-800">
            <CardContent className="pt-6">
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
          </Card>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">Todos ({allFilteredPagamentos.length})</TabsTrigger>
              <TabsTrigger value="pending">Pendentes ({pendingPagamentos.length})</TabsTrigger>
              <TabsTrigger value="vista">À Vista ({vistaCompletedPagamentos.length})</TabsTrigger>
              <TabsTrigger value="completed">Completos ({otherCompletedPagamentos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingPagamentos.length === 0 ? (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-blue-300">
                      {pagamentos.filter((p) => p.status !== "completed" && p.status !== "cancelled").length === 0
                        ? "Nenhum pagamento pendente"
                        : "Nenhum pagamento encontrado com os filtros aplicados"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingPagamentos.map((pagamento) => {
                  const statusConfig = getStatusBadge(pagamento.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <Card key={pagamento.id} className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
                      <CardHeader className="pb-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <CardTitle className="text-lg text-white">{getAlunoName(pagamento.alunoId)}</CardTitle>
                            <p className="text-sm text-blue-300 font-medium">
                              {getTurmaName(pagamento.turmaId)}
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant} className="shrink-0 bg-orange-500 text-white border-orange-600">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-blue-300 mb-1">Valor Total</p>
                            <p className="font-semibold text-lg text-white">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-300 mb-1">Prestações</p>
                            <p className="font-semibold text-white">
                              {getStats(pagamento.id).paidCount}/{pagamento.installments}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-300 mb-1">Método</p>
                            <p className="font-semibold capitalize text-white">
                              {pagamento.paymentMethod === "cash"
                                ? "Dinheiro"
                                : pagamento.paymentMethod === "transfer"
                                  ? "Transferência"
                                  : "Multicaixa"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-300 mb-1">Data</p>
                            <p className="font-semibold text-sm text-white">{pagamento.createdAt.toLocaleDateString("pt-AO")}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-blue-800">
                          <Button size="sm" variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400" onClick={() => handleViewInstallments(pagamento)}>
                            Ver Prestações
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="vista" className="space-y-4">
              {vistaCompletedPagamentos.length === 0 ? (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-blue-300">
                      {pagamentos.filter((p) => p.status === "completed" && p.paymentMethod === "cash").length === 0
                        ? "Nenhum pagamento à vista"
                        : "Nenhum pagamento encontrado com os filtros aplicados"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                vistaCompletedPagamentos.map((pagamento) => {
                  const statusConfig = getStatusBadge(pagamento.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <Card key={pagamento.id} className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-white">{getAlunoName(pagamento.alunoId)}</p>
                            <p className="text-sm text-blue-300">{getTurmaName(pagamento.turmaId)}</p>
                            <p className="text-sm font-semibold text-white">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                            <p className="text-sm text-blue-300">
                              {getStats(pagamento.id).paidCount}/{pagamento.installments} prestações
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant} className="bg-green-500 text-white border-green-600">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <Progress value={100} className="h-2 bg-blue-800" />
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {otherCompletedPagamentos.length === 0 ? (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-blue-300">
                      {pagamentos.filter((p) => p.status === "completed" && p.paymentMethod !== "cash").length === 0
                        ? "Nenhum pagamento completo"
                        : "Nenhum pagamento encontrado com os filtros aplicados"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                otherCompletedPagamentos.map((pagamento) => {
                  const statusConfig = getStatusBadge(pagamento.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <Card key={pagamento.id} className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-white">{getAlunoName(pagamento.alunoId)}</p>
                            <p className="text-sm text-blue-300">{getTurmaName(pagamento.turmaId)}</p>
                            <p className="text-sm font-semibold text-white">
                              {pagamento.amount.toLocaleString("pt-AO")} Kz
                            </p>
                            <p className="text-sm text-blue-300">
                              {getStats(pagamento.id).paidCount}/{pagamento.installments} prestações
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant} className="bg-green-500 text-white border-green-600">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <Progress value={100} className="h-2 bg-blue-800" />
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allFilteredPagamentos.length === 0 ? (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-blue-300">
                      {pagamentos.length === 0
                        ? "Nenhum pagamento cadastrado"
                        : "Nenhum pagamento encontrado com os filtros aplicados"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                allFilteredPagamentos.map((pagamento) => {
                  const statusConfig = getStatusBadge(pagamento.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <Card key={pagamento.id} className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-white">{getAlunoName(pagamento.alunoId)}</p>
                            <p className="text-sm text-blue-300">{getTurmaName(pagamento.turmaId)}</p>
                            <p className="text-sm font-semibold text-white">
                              {pagamento.amount.toLocaleString("pt-AO")} Kz
                            </p>
                            <p className="text-sm text-blue-300">
                              {getStats(pagamento.id).paidCount}/{pagamento.installments} prestações
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant} className="bg-orange-500 text-white border-orange-600">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <Progress value={getStats(pagamento.id).percentage} className="h-2 bg-blue-800" />
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de Prestações */}
      <Dialog
        open={installmentsDialog.open}
        onOpenChange={(open) => setInstallmentsDialog({ ...installmentsDialog, open })}
      >
        <DialogContent className="max-w-2xl bg-blue-900/40 border-blue-800">
          <DialogHeader>
            <DialogTitle className="text-white">Prestações do Pagamento</DialogTitle>
          </DialogHeader>
          {installmentsDialog.pagamento && (
            <div className="space-y-4">
              <div className="bg-blue-800/40 p-4 rounded-lg space-y-2 border border-blue-700">
                <p className="font-semibold text-white">{getAlunoName(installmentsDialog.pagamento.alunoId)}</p>
                <p className="text-sm text-blue-300">{getTurmaName(installmentsDialog.pagamento.turmaId)}</p>
                <p className="text-sm text-blue-200">
                  Total:{" "}
                  <span className="font-semibold text-white">
                    {installmentsDialog.pagamento.amount.toLocaleString("pt-AO")} Kz
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {installmentsDialog.installments.map((installment) => (
                  <Card key={installment.id} className="bg-blue-900/30 border-blue-800">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-white">{installment.installmentNumber}ª Prestação</p>
                          <p className="text-sm text-blue-300">
                            {installment.amount.toLocaleString("pt-AO")} Kz
                          </p>
                          <div className="flex items-center gap-2 text-sm text-blue-300">
                            <Calendar className="h-3 w-3" />
                            Vence: {installment.dueDate.toLocaleDateString("pt-AO")}
                          </div>
                          {installment.paidAt && (
                            <p className="text-sm text-green-400">
                              Pago em: {installment.paidAt.toLocaleDateString("pt-AO")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={installment.status === "paid" ? "default" : "outline"} className={installment.status === "paid" ? "bg-green-500 text-white border-green-600" : "border-orange-500 text-orange-400"}>
                            {installment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                          {installment.status === "pending" && (
                            <Button size="sm" onClick={() => handlePayInstallment(installment.id)} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
                              {loading ? "Processando..." : "Marcar como Pago"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Botão de Assinar Próxima Prestação */}
              {installmentsDialog.pagamento.status === "partial" &&
                installmentsDialog.installments.some((i) => i.status !== "paid") && (
                  <Button
                    onClick={handleSignNextInstallment}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? "Processando..." : "✓ Assinar Próxima Prestação"}
                  </Button>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
