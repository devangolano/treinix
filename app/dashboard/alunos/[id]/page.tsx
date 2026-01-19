"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService, centroService } from "@/lib/supabase-services"
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
} from "lucide-react"
import Link from "next/link"
import type { Aluno, Formacao, Turma, Pagamento, Centro } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { generateAlunoPDF } from "@/lib/pdf-generator"

export default function DetalhesAlunoPage() {
  const router = useRouter()
  const params = useParams()
  const alunoId = params.id as string
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [formacao, setFormacao] = useState<Formacao | null>(null)
  const [turma, setTurma] = useState<Turma | null>(null)
  const [centro, setCentro] = useState<Centro | null>(null)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [installmentStats, setInstallmentStats] = useState<Record<string, { paidCount: number; totalCount: number; percentage: number }>>({})

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router, alunoId])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      const alunoData = await alunoService.getById(alunoId)
      
      if (!alunoData) {
        toast({ title: "Aluno não encontrado", variant: "destructive" })
        router.push("/dashboard/alunos")
        return
      }

      setAluno(alunoData)

      // Carregar dados do centro
      const centroData = await centroService.getById(centroId)
      setCentro(centroData || null)

      if (alunoData.formacaoId) {
        const formacaoData = await formacaoService.getById(alunoData.formacaoId)
        setFormacao(formacaoData || null)
      }

      if (alunoData.turmaId) {
        const turmaData = await turmaService.getById(alunoData.turmaId)
        setTurma(turmaData || null)
      }

      const pagamentosData = await pagamentoService.getAll(centroId)
      const filtered = pagamentosData.filter((p) => p.alunoId === alunoId)
      setPagamentos(filtered)

      // Buscar todos os alunos para mostrar quantos estão na mesma turma
      const alunosData = await alunoService.getAll(centroId)
      setAlunos(alunosData)

      // Calcular stats de prestações para cada pagamento
      const stats: Record<string, { paidCount: number; totalCount: number; percentage: number }> = {}
      for (const pagamento of filtered) {
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

  const handleDownloadPDF = async () => {
    try {
      if (!aluno || !formacao || !turma || !centro) {
        toast({ title: "Erro", description: "Dados incompletos para gerar o PDF", variant: "destructive" })
        return
      }

      // Obter dados de pagamento
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
        formacaoName: formacao.name,
        turmaName: turma.name,
        status: aluno.status,
        createdAt: aluno.createdAt,
        centroName: centro.name,
        centroEmail: centro.email,
        centroPhone: centro.phone,
        centroAddress: centro.address,
        paymentMethod: pagamento ? paymentMethodMap[pagamento.paymentMethod] || pagamento.paymentMethod : undefined,
        paymentStatus: pagamento ? paymentStatus : "pending",
        installmentsPaid: pagamento?.installmentsPaid,
        totalInstallments: pagamento?.installments,
        systemPhone: "Contacto: 948324028",
      })

      toast({ title: "Ficha baixada com sucesso!", description: `${aluno.name}.pdf` })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({ title: "Erro ao gerar PDF", variant: "destructive" })
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
              <Button onClick={handleDownloadPDF} variant="outline" className="border-green-600 text-green-300 hover:bg-green-600 hover:text-white hover:border-green-600">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Link href={`/dashboard/alunos/${alunoId}/editar`}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>

          {/* Card Único com Todas as Seções */}
          <Card className="bg-blue-900/20 border-blue-800">
            <CardContent className="pt-6">
              {/* Seção: Informações Pessoais (com Nome e Status) */}
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

              {/* Seção: Formação Matriculada */}
              {formacao && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="h-5 w-5 text-orange-400" />
                    <h2 className="text-xl font-bold text-white">Formação Matriculada</h2>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-blue-700/50">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Curso</p>
                      <p className="text-sm text-blue-200">{formacao.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Categoria</p>
                      <p className="text-sm text-blue-200">{formacao.category}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Duração</p>
                      <p className="text-sm text-blue-200">{formacao.duration}h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Valor</p>
                      <p className="text-sm font-bold text-orange-400">{formacao.price.toLocaleString("pt-AO")} Kz</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-4 pb-6 border-b border-blue-700/50">
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Descrição</p>
                    <p className="text-sm text-blue-300">{formacao.description}</p>
                  </div>
                </div>
              )}

              {/* Seção: Turma */}
              {turma && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-orange-400" />
                    <h2 className="text-xl font-bold text-white">Turma</h2>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 pb-6 border-b border-blue-700/50">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Nome da Turma</p>
                      <p className="text-sm text-blue-200">{turma.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Horário</p>
                      <p className="text-sm text-blue-200">{turma.schedule}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Vagas</p>
                      <p className="text-sm text-blue-200">{alunos.filter((a) => a.turmaId === turma.id).length} / {turma.maxStudents} alunos</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Data de Início</p>
                      <p className="text-sm text-blue-200">{new Date(turma.startDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Data de Término</p>
                      <p className="text-sm text-blue-200">{new Date(turma.endDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção: Histórico de Pagamentos */}
              {pagamentos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-orange-400" />
                    <h2 className="text-xl font-bold text-white">Histórico de Pagamentos</h2>
                  </div>

                  <div className="space-y-2">
                    {pagamentos.map((pagamento) => {
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

                      return (
                        <div key={pagamento.id} className="border border-blue-700/50 rounded-lg p-3 bg-blue-900/10 hover:bg-blue-900/20 transition-colors">
                          <Separator className="my-2 bg-blue-700/30" />
                          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
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
                              <p className="text-blue-200">{getStats(pagamento.id).paidCount}/{pagamento.installments}</p>
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
