"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService, centroService, matriculaService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Download,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  GraduationCap,
  Users,
  Award as IdCard,
  Plus,
} from "lucide-react"
import Link from "next/link"
import type { Aluno, Formacao, Turma, Pagamento, Centro, Matricula } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { generateAlunoPDF } from "@/lib/pdf-generator"

export default function DetalhesAlunoPage() {
  const router = useRouter()
  const params = useParams()
  const alunoId = params.id as string
  const { user: currentUser } = useAuth()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [centro, setCentro] = useState<Centro | null>(null)
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [formacoesMap, setFormacoesMap] = useState<Record<string, Formacao>>({})
  const [turmasMap, setTurmasMap] = useState<Record<string, Turma>>({})
  const [pagamentosMap, setPagamentosMap] = useState<Record<string, Pagamento[]>>({})
  const [loading, setLoading] = useState(true)
  const [installmentStats, setInstallmentStats] = useState<Record<string, { paidCount: number; totalCount: number; percentage: number }>>({})

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router, alunoId])

  // Listener para recarregar dados quando um pagamento for criado
  useEffect(() => {
    const handlePagamentoCreated = () => {
      console.log("📢 [DetalhesAluno] Evento: pagamento criado, recarregando dados...")
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
  }, [currentUser, alunoId])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      console.log("[DetalhesAluno] Carregando dados para aluno:", alunoId)
      
      // Carregar aluno
      const alunoData = await alunoService.getById(alunoId)
      
      if (!alunoData) {
        toast.error("Aluno não encontrado")
        router.push("/dashboard/alunos")
        return
      }

      setAluno(alunoData)
      console.log("[DetalhesAluno] Aluno carregado:", alunoData.name)

      // Carregar dados do centro
      const centroData = await centroService.getById(centroId)
      setCentro(centroData || null)

      // Carregar matrículas do aluno
      const matriculasData = await matriculaService.getByAlunoId(alunoId)
      setMatriculas(matriculasData)
      console.log("[DetalhesAluno] Matrículas encontradas:", matriculasData.length)

      // Carregar dados de formações e turmas
      const [formacoesData, turmasData, pagamentosData] = await Promise.all([
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
        pagamentoService.getAll(centroId),
      ])

      // Criar mapas para acesso rápido
      const formacoesMapLocal: Record<string, Formacao> = {}
      formacoesData.forEach((f) => {
        formacoesMapLocal[f.id] = f
      })
      setFormacoesMap(formacoesMapLocal)

      const turmasMapLocal: Record<string, Turma> = {}
      turmasData.forEach((t) => {
        turmasMapLocal[t.id] = t
      })
      setTurmasMap(turmasMapLocal)

      // Organizar pagamentos por matrícula
      const pagamentosMapLocal: Record<string, Pagamento[]> = {}
      console.log("[DetalhesAluno] Total de pagamentos disponíveis:", pagamentosData.length)
      console.log("[DetalhesAluno] Matrículas para mapear:", matriculasData.map(m => ({ id: m.id, formacao: m.formacaoId })))
      
      matriculasData.forEach((m) => {
        const pagamentosMatricula = pagamentosData.filter((p) => p.matriculaId === m.id)
        console.log(`[DetalhesAluno] Matrícula ${m.id} tem ${pagamentosMatricula.length} pagamentos`)
        if (pagamentosMatricula.length > 0) {
          console.log(`[DetalhesAluno] Pagamentos da matrícula:`, pagamentosMatricula.map(p => ({ id: p.id, matriculaId: p.matriculaId, amount: p.amount })))
        }
        pagamentosMapLocal[m.id] = pagamentosMatricula
      })
      setPagamentosMap(pagamentosMapLocal)
      console.log("[DetalhesAluno] Pagamentos mapeados por matrícula:", Object.keys(pagamentosMapLocal).map(k => ({ matriculaId: k, count: pagamentosMapLocal[k].length })))

      // Calcular stats de prestações para cada pagamento
      const stats: Record<string, { paidCount: number; totalCount: number; percentage: number }> = {}
      for (const pagamentosList of Object.values(pagamentosMapLocal)) {
        for (const pagamento of pagamentosList) {
          try {
            const installments = await pagamentoInstallmentService.getByPagamentoId(pagamento.id)
            const paidCount = installments.filter((i) => i.status === "paid").length
            stats[pagamento.id] = {
              paidCount,
              totalCount: installments.length,
              percentage: installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0,
            }
          } catch (error) {
            console.error(`[DetalhesAluno] Erro ao buscar prestações do pagamento ${pagamento.id}:`, error)
            stats[pagamento.id] = { paidCount: 0, totalCount: 0, percentage: 0 }
          }
        }
      }
      setInstallmentStats(stats)
    } catch (error) {
      console.error("[DetalhesAluno] Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const getStats = (pagamentoId: string) => {
    return installmentStats[pagamentoId] || { paidCount: 0, totalCount: 0, percentage: 0 }
  }

  const getRealStatus = (pagamento: Pagamento) => {
    const stats = getStats(pagamento.id)
    if (stats.paidCount === stats.totalCount && stats.totalCount > 0) {
      return "completed"
    }
    return pagamento.status
  }

  const handleDownloadPDF = async (matricula: Matricula) => {
    try {
      const formacao = formacoesMap[matricula.formacaoId]
      const turma = turmasMap[matricula.turmaId]
      
      if (!aluno || !formacao || !turma || !centro) {
        toast.error("Dados incompletos para gerar o PDF")
        return
      }

      const pagamentos = pagamentosMap[matricula.id] || []
      const pagamento = pagamentos.length > 0 ? pagamentos[0] : null

      // Converter status de pagamento
      let paymentStatus: "paid" | "half-paid" | "pending" = "pending"
      if (pagamento) {
        if (pagamento.status === "completed") {
          paymentStatus = "paid"
        } else if (pagamento.status === "partial") {
          paymentStatus = "half-paid"
        }
      }

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
        centroName: centro.name,
        centroEmail: centro.email,
        centroPhone: centro.phone,
        centroAddress: centro.address,
        centroLogoUrl: centro.logoUrl,
        formacao: formacao.name,
        turma: turma.name,
        paymentMethod: pagamento ? paymentMethodMap[pagamento.paymentMethod] || pagamento.paymentMethod : undefined,
        paymentStatus: pagamento ? paymentStatus : "pending",
        installmentsPaid: pagamento?.installmentsPaid,
        totalInstallments: pagamento?.installments,
        systemPhone: "Contacto: 948324028",
      })

      toast.success("Ficha baixada com sucesso!")
    } catch (error) {
      console.error("[DetalhesAluno] Erro ao gerar PDF:", error)
      toast.error("Erro ao gerar PDF")
    }
  }

  if (!currentUser || !aluno) return null

  const statusText = aluno.status === "active" ? "Ativo" : "Inativo"
  const statusVariant = aluno.status === "active" ? "default" : "secondary"

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-6xl px-4 md:px-6 py-6 md:py-8">
          {/* Header com Botões */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Link href="/dashboard/alunos">
              <Button variant="ghost" size="sm" className="text-blue-300 hover:text-orange-400 hover:bg-blue-900/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Alunos
              </Button>
            </Link>

            <div className="flex gap-2">
              <Link href={`/dashboard/alunos/${alunoId}/nova-matricula`}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" />
                  Matricular em Curso
                </Button>
              </Link>
              <Link href={`/dashboard/alunos/${alunoId}/editar`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Dados
                </Button>
              </Link>
            </div>
          </div>

          {/* Card Único com Todas as Seções */}
          <Card className="bg-blue-900/20 border-blue-800">
            <CardContent className="pt-6">
              {/* Seção: Informações Pessoais */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <IdCard className="h-5 w-5 text-orange-400" />
                  <h2 className="text-xl font-bold text-white">Informações Pessoais</h2>
                </div>

                {/* Nome e Status */}
                <div className="flex flex-col justify-between md:flex-row md:items-center md:gap-4 mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{aluno.name}</h1>
                  <Badge variant={statusVariant} className="bg-orange-500 text-white border-orange-600 px-3 py-1 w-fit">
                    {statusText}
                  </Badge>
                </div>

                {/* Informações em grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm text-blue-200">{aluno.email}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Telefone</p>
                    <p className="text-sm text-blue-200">{aluno.phone}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">BI</p>
                    <p className="text-sm text-blue-200">{aluno.bi}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Data de Nascimento</p>
                    <p className="text-sm text-blue-200">{new Date(aluno.birthDate).toLocaleDateString("pt-AO")}</p>
                  </div>

                  <div className="col-span-2 md:col-span-1 space-y-1">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Endereço</p>
                    <p className="text-sm text-blue-200">{aluno.address}</p>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <Separator className="my-6 bg-blue-700/50" />

              {/* Seção: Matrículas */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-orange-400" />
                  <h2 className="text-xl font-bold text-white">
                    Matrículas ({matriculas.length})
                  </h2>
                </div>

                {matriculas.length === 0 ? (
                  <div className="bg-blue-900/10 border border-blue-700/50 rounded-lg p-6 text-center">
                    <p className="text-blue-300 mb-4">Este aluno não possui matrículas ativas.</p>
                    <Link href={`/dashboard/alunos/${alunoId}/nova-matricula`}>
                      <Button className="bg-orange-500 hover:bg-orange-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeira Matrícula
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matriculas.map((matricula) => {
                      const formacao = formacoesMap[matricula.formacaoId]
                      const turma = turmasMap[matricula.turmaId]
                      const pagamentosList = pagamentosMap[matricula.id] || []
                      
                      console.log(`[DetalhesAluno-Render] Matrícula ${matricula.id.substring(0, 8)}... tem ${pagamentosList.length} pagamentos`)

                      return (
                        <div key={matricula.id} className="border border-blue-700/50 rounded-lg p-4 bg-blue-900/10 hover:bg-blue-900/20 transition-colors">
                          {/* Cabeçalho da Matrícula */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-white">{formacao?.name || "Formação"}</h3>
                                <p className="text-sm text-blue-300">{turma?.name || "Turma"}</p>
                              </div>
                              <Badge className="bg-green-600/30 text-green-300 border-green-600">
                                {matricula.status === "active" ? "Ativa" : matricula.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Informações da Formação e Turma */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-blue-700/30">
                            {formacao && (
                              <>
                                <div>
                                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Categoria</p>
                                  <p className="text-sm text-blue-200">{formacao.category}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Duração</p>
                                  <p className="text-sm text-blue-200">{formacao.duration}h</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Valor</p>
                                  <p className="text-sm font-bold text-orange-400">{formacao.price.toLocaleString("pt-AO")} Kz</p>
                                </div>
                              </>
                            )}
                            {turma && (
                              <div>
                                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Horário</p>
                                <p className="text-sm text-blue-200">{turma.schedule}</p>
                              </div>
                            )}
                          </div>

                          {/* Data de Matrícula */}
                          <div className="mb-4 flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-orange-400" />
                            <span className="text-blue-300">
                              Matriculado em: {new Date(matricula.enrollmentDate).toLocaleDateString("pt-AO")}
                            </span>
                          </div>

                          {/* Pagamentos da Matrícula */}
                          {pagamentosList.length > 0 ? (
                            <div className="bg-blue-900/20 rounded p-3 mb-4">
                              <h4 className="text-sm font-semibold text-orange-400 mb-3">Pagamentos</h4>
                              <div className="space-y-2">
                                {pagamentosList.map((pagamento) => {
                                  const metodoPagamento = {
                                    cash: "Dinheiro",
                                    transfer: "Transferência",
                                    multicaixa: "Multicaixa",
                                  }[pagamento.paymentMethod]

                                  const realStatus = getRealStatus(pagamento)
                                  const statusPagamento = {
                                    pending: "Pendente",
                                    partial: "Parcial",
                                    completed: "Pago",
                                    cancelled: "Cancelado",
                                  }[realStatus]

                                  const statusColor = {
                                    pending: "secondary",
                                    partial: "default",
                                    completed: "default",
                                    cancelled: "destructive",
                                  }[realStatus] as any

                                  const stats = getStats(pagamento.id)

                                  return (
                                    <div key={pagamento.id} className="border border-blue-600/30 rounded p-2 bg-blue-900/30">
                                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                        <div>
                                          <p className="text-blue-400 font-semibold">Valor</p>
                                          <p className="font-bold text-orange-400">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                                        </div>
                                        <div>
                                          <p className="text-blue-400 font-semibold">Data</p>
                                          <p className="text-blue-200">{new Date(pagamento.createdAt).toLocaleDateString("pt-AO")}</p>
                                        </div>
                                        <div>
                                          <p className="text-blue-400 font-semibold">Método</p>
                                          <p className="text-blue-200">{metodoPagamento}</p>
                                        </div>
                                        <div>
                                          <p className="text-blue-400 font-semibold">Prestações</p>
                                          <p className="text-blue-200">{stats.paidCount}/{pagamento.installments}</p>
                                        </div>
                                        <div>
                                          <p className="text-blue-400 font-semibold">Status</p>
                                          <Badge variant={statusColor} className="bg-orange-500 text-white border-orange-600 w-fit text-xs mt-1">
                                            {statusPagamento}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-blue-900/20 rounded p-3 mb-4 border border-dashed border-blue-600">
                              <p className="text-sm text-blue-300">Nenhum pagamento registrado para esta matrícula</p>
                            </div>
                          )}

                          {/* Botão de Download PDF */}
                          <div className="flex justify-end">
                            <Button
                              onClick={() => handleDownloadPDF(matricula)}
                              variant="outline"
                              size="sm"
                              className="border-green-600 text-green-300 hover:bg-green-600 hover:text-white hover:border-green-600"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Ficha da Matrícula
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
