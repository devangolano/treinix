"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { alunoService, formacaoService, turmaService, pagamentoService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Search,
  Filter,
  Eye,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Aluno, Formacao, Turma, Pagamento } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function AlunosPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formacaoFilter, setFormacaoFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (authLoading) return

    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    loadData(user.centroId)
  }, [user, authLoading, router])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      setError(null)

      const [alunosData, formacoesData, turmasData, pagamentosData] = await Promise.all([
        alunoService.getAll(centroId),
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
        pagamentoService.getAll(centroId),
      ])

      setAlunos(alunosData)
      setFormacoes(formacoesData)
      setTurmas(turmasData)
      setPagamentos(pagamentosData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      console.error("Erro ao carregar dados:", err)
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      })
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
        toast({
          title: "Sucesso",
          description: "Aluno deletado com sucesso",
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar aluno",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Erro ao deletar aluno:", err)
      toast({
        title: "Erro",
        description: "Erro ao deletar aluno",
        variant: "destructive",
      })
    }
  }

  const getFormacaoName = (id?: string) => {
    if (!id) return "-"
    return formacoes.find((f) => f.id === id)?.name || "-"
  }

  const getTurmaName = (id?: string) => {
    if (!id) return "-"
    return turmas.find((t) => t.id === id)?.name || "-"
  }

  const getPaymentStatus = (alunoId: string) => {
    const pagamento = pagamentos.find((p) => p.alunoId === alunoId)
    if (!pagamento) return null

    return {
      amount: pagamento.amount,
      status: pagamento.status,
      installments: pagamento.installments,
      installmentsPaid: pagamento.installmentsPaid,
    }
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

    const matchesStatus = statusFilter === "all" || aluno.status === statusFilter
    const matchesFormacao = formacaoFilter === "all" || aluno.formacaoId === formacaoFilter

    return matchesSearch && matchesStatus && matchesFormacao
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return

    try {
      await alunoService.delete(id)
      toast({ title: "Aluno excluído com sucesso!" })
      if (user?.centroId) loadData(user.centroId)
    } catch (error) {
      toast({ title: "Erro ao excluir aluno", variant: "destructive" })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen">
        <CentroSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Alunos</h1>
              <p className="text-muted-foreground">Gerencie os alunos do seu centro</p>
            </div>

            <Link href="/dashboard/alunos/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Aluno
              </Button>
            </Link>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email ou BI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-35">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
                    <SelectTrigger className="w-40">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Formação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Formações</SelectItem>
                      {formacoes.map((formacao) => (
                        <SelectItem key={formacao.id} value={formacao.id}>
                          {formacao.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {filteredAlunos.length === alunos.length ? (
                  <span>{alunos.length} aluno(s) no total</span>
                ) : (
                  <span>
                    {filteredAlunos.length} de {alunos.length} aluno(s) encontrado(s)
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {filteredAlunos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {alunos.length === 0
                      ? "Nenhum aluno cadastrado"
                      : "Nenhum aluno encontrado com os filtros aplicados"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlunos.map((aluno) => {
                const paymentStatus = getPaymentStatus(aluno.id)
                const paymentInfo = paymentStatus
                  ? {
                      pagamento: {
                        status: paymentStatus.status,
                        amount: paymentStatus.amount,
                        installments: paymentStatus.installments,
                        installmentsPaid: paymentStatus.installmentsPaid,
                        paymentMethod: "cash",
                      },
                      totalPaid:
                        (paymentStatus.amount / paymentStatus.installments) * paymentStatus.installmentsPaid,
                      totalRemaining:
                        paymentStatus.amount -
                        (paymentStatus.amount / paymentStatus.installments) * paymentStatus.installmentsPaid,
                    }
                  : null

                return (
                  <Card key={aluno.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{aluno.name}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">BI:</span>
                            <span>{aluno.bi}</span>
                            <span>•</span>
                            <span>{new Date(aluno.birthDate).toLocaleDateString("pt-AO")}</span>
                          </div>
                        </div>
                        <Badge variant={aluno.status === "active" ? "default" : "secondary"} className="h-fit shrink-0">
                          {aluno.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{aluno.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{aluno.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm md:col-span-2">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span>{aluno.address}</span>
                        </div>
                      </div>

                      {(aluno.formacaoId || aluno.turmaId) && (
                        <>
                          <Separator />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {aluno.formacaoId && (
                              <div className="flex items-start gap-3 text-sm">
                                <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-muted-foreground text-xs mb-1">Formação</p>
                                  <p className="font-medium">{getFormacaoName(aluno.formacaoId)}</p>
                                </div>
                              </div>
                            )}
                            {aluno.turmaId && (
                              <div className="flex items-start gap-3 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-muted-foreground text-xs mb-1">Turma</p>
                                  <p className="font-medium">{getTurmaName(aluno.turmaId)}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {paymentInfo && (
                        <>
                          <Separator />
                          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">Informações de Pagamento</span>
                              </div>
                              <Badge
                                variant={
                                  paymentInfo.pagamento.status === "completed"
                                    ? "default"
                                    : paymentInfo.pagamento.status === "partial"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {paymentInfo.pagamento.status === "completed"
                                  ? "Pago"
                                  : paymentInfo.pagamento.status === "partial"
                                    ? "Parcial"
                                    : "Pendente"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Valor Total</p>
                                <p className="font-semibold">{formatCurrency(paymentInfo.pagamento.amount)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Pago</p>
                                <p className="font-semibold text-green-600">{formatCurrency(paymentInfo.totalPaid)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Prestações</p>
                                <p className="font-semibold">
                                  {paymentInfo.pagamento.installmentsPaid}/{paymentInfo.pagamento.installments}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Método</p>
                                <p className="font-medium capitalize">
                                  {paymentInfo.pagamento.paymentMethod === "cash"
                                    ? "Dinheiro"
                                    : paymentInfo.pagamento.paymentMethod === "transfer"
                                      ? "Transferência"
                                      : "Multicaixa"}
                                </p>
                              </div>
                            </div>

                            {paymentInfo.pagamento.status !== "completed" && paymentInfo.totalRemaining > 0 && (
                              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md p-3 mt-3">
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-amber-900 dark:text-amber-100">
                                    Falta pagar: {formatCurrency(paymentInfo.totalRemaining)}
                                  </p>
                                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                    {paymentInfo.pagamento.installments - paymentInfo.pagamento.installmentsPaid}{" "}
                                    prestação(ões) pendente(s)
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <Separator />

                      <div className="flex gap-3">
                        <Link href={`/dashboard/alunos/${aluno.id}`} className="flex-1">
                          <Button size="sm" variant="default" className="w-full">
                            <Eye className="h-3 w-3 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Link href={`/dashboard/alunos/${aluno.id}/editar`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full bg-transparent">
                            <Pencil className="h-3 w-3 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(aluno.id)}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
