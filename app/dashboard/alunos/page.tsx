"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService } from "@/lib/supabase-services"
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
  Phone,
  GraduationCap,
  Search,
  Filter,
  Eye,
  Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Aluno, Formacao, Turma, Pagamento } from "@/lib/types"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
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
  const [installmentStats, setInstallmentStats] = useState<Record<string, { paidCount: number; totalCount: number; percentage: number }>>({})
  const { toast } = useToast()

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
      id: pagamento.id,
    }
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

          <Card className="mb-6 bg-blue-900/30 border-blue-800">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Buscar por nome, email ou BI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-35 bg-blue-800/40 border-blue-700 text-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
                    <SelectTrigger className="w-40 bg-blue-800/40 border-blue-700 text-white">
                      <GraduationCap className="h-4 w-4 mr-2" />
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
              </div>
              <div className="mt-4 text-sm text-blue-300">
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

          <div className="space-y-2">
            {filteredAlunos.length === 0 ? (
              <Card className="bg-blue-900/30 border-blue-800">
                <CardContent className="py-12 text-center">
                  <p className="text-blue-300">
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
                        installmentsPaid: getStats(paymentStatus.id).paidCount,
                        paymentMethod: "cash",
                        id: paymentStatus.id,
                      },
                      totalPaid:
                        (paymentStatus.amount / paymentStatus.installments) * getStats(paymentStatus.id).paidCount,
                      totalRemaining:
                        paymentStatus.amount -
                        (paymentStatus.amount / paymentStatus.installments) * getStats(paymentStatus.id).paidCount,
                    }
                  : null

                return (
                  <Card key={aluno.id} className="hover:shadow-md transition-shadow bg-blue-900/30 border-blue-800 hover:border-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="space-y-2 flex-1">
                          <p className="font-semibold text-lg text-white">{aluno.name}</p>
                          <div className="flex items-center gap-3 text-sm text-blue-300">
                            <Phone className="h-4 w-4" />
                            <span>{aluno.phone}</span>
                          {aluno.formacaoId && (
                            <div className="flex items-center gap-3 text-sm text-blue-300">
                              <GraduationCap className="h-4 w-4" />
                              <span>{getFormacaoName(aluno.formacaoId)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-sm text-blue-300">
                          <Mail className="h-4 w-4" />
                          <p>{aluno.email}</p>
                            </div>
                          </div>
                        </div>
                        <Badge variant={aluno.status === "active" ? "default" : "secondary"} className="h-fit shrink-0 bg-orange-500 text-white border-orange-600">
                          {aluno.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <Separator className="my-4 bg-blue-700" />

                      <div className="flex gap-3">
                        <Link href={`/dashboard/alunos/${aluno.id}`} className="flex-1">
                          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Eye className="h-3 w-3 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                        <Link href={`/dashboard/alunos/${aluno.id}/editar`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full border-blue-700 text-blue-200 hover:bg-orange-500 hover:text-white hover:border-orange-500">
                            <Pencil className="h-3 w-3 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(aluno.id)} className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-3 w-3 mr-2" />
                          Deletar
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
