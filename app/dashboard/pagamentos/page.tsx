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
      toast({ title: "Prestação paga com sucesso!" })
      if (currentUser?.centroId) {
        await loadData(currentUser.centroId)
        if (installmentsDialog.pagamento) {
          const installments = await pagamentoInstallmentService.getByPagamentoId(installmentsDialog.pagamento.id)
          setInstallmentsDialog({ ...installmentsDialog, installments })
        }
      }
    } catch (error) {
      console.error("Erro ao pagar prestação:", error)
      toast({ title: "Erro ao pagar prestação", variant: "destructive" })
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
  const completedPagamentos = filterPagamentos(pagamentos.filter((p) => p.status === "completed"))
  const allFilteredPagamentos = filterPagamentos(pagamentos)

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Pagamentos</h1>
              <p className="text-muted-foreground">Gerencie pagamentos e prestações</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por aluno ou turma..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-full md:w-45">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Métodos</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="multicaixa">Multicaixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">Pendentes ({pendingPagamentos.length})</TabsTrigger>
              <TabsTrigger value="completed">Completos ({completedPagamentos.length})</TabsTrigger>
              <TabsTrigger value="all">Todos ({allFilteredPagamentos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingPagamentos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
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
                    <Card key={pagamento.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <CardTitle className="text-lg">{getAlunoName(pagamento.alunoId)}</CardTitle>
                            <p className="text-sm text-muted-foreground font-medium">
                              {getTurmaName(pagamento.turmaId)}
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant} className="shrink-0">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
                            <p className="font-semibold text-lg">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Prestações</p>
                            <p className="font-semibold">
                              {pagamento.installmentsPaid}/{pagamento.installments}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Método</p>
                            <p className="font-semibold capitalize">
                              {pagamento.paymentMethod === "cash"
                                ? "Dinheiro"
                                : pagamento.paymentMethod === "transfer"
                                  ? "Transferência"
                                  : "Multicaixa"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Data</p>
                            <p className="font-semibold text-sm">{pagamento.createdAt.toLocaleDateString("pt-AO")}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <Button size="sm" variant="outline" onClick={() => handleViewInstallments(pagamento)}>
                            Ver Prestações
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedPagamentos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {pagamentos.filter((p) => p.status === "completed").length === 0
                        ? "Nenhum pagamento completo"
                        : "Nenhum pagamento encontrado com os filtros aplicados"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedPagamentos.map((pagamento) => {
                  const statusConfig = getStatusBadge(pagamento.status)
                  const StatusIcon = statusConfig.icon
                  return (
                    <Card key={pagamento.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{getAlunoName(pagamento.alunoId)}</p>
                            <p className="text-sm text-muted-foreground">{getTurmaName(pagamento.turmaId)}</p>
                            <p className="text-sm font-semibold">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                          </div>
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allFilteredPagamentos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
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
                    <Card key={pagamento.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{getAlunoName(pagamento.alunoId)}</p>
                            <p className="text-sm text-muted-foreground">{getTurmaName(pagamento.turmaId)}</p>
                            <p className="text-sm">
                              {pagamento.amount.toLocaleString("pt-AO")} Kz - {pagamento.installmentsPaid}/
                              {pagamento.installments} prestações
                            </p>
                          </div>
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prestações do Pagamento</DialogTitle>
          </DialogHeader>
          {installmentsDialog.pagamento && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">{getAlunoName(installmentsDialog.pagamento.alunoId)}</p>
                <p className="text-sm text-muted-foreground">{getTurmaName(installmentsDialog.pagamento.turmaId)}</p>
                <p className="text-sm">
                  Total:{" "}
                  <span className="font-semibold">
                    {installmentsDialog.pagamento.amount.toLocaleString("pt-AO")} Kz
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                {installmentsDialog.installments.map((installment) => (
                  <Card key={installment.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-medium">{installment.installmentNumber}ª Prestação</p>
                          <p className="text-sm text-muted-foreground">
                            {installment.amount.toLocaleString("pt-AO")} Kz
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Vence: {installment.dueDate.toLocaleDateString("pt-AO")}
                          </div>
                          {installment.paidAt && (
                            <p className="text-sm text-green-600">
                              Pago em: {installment.paidAt.toLocaleDateString("pt-AO")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={installment.status === "paid" ? "default" : "outline"}>
                            {installment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                          {installment.status === "pending" && (
                            <Button size="sm" onClick={() => handlePayInstallment(installment.id)} disabled={loading}>
                              {loading ? "Processando..." : "Marcar como Pago"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
