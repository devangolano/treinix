"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService, centroService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
        <div className="container max-w-5xl px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard/alunos">
              <Button variant="ghost" size="sm" className="text-blue-300 hover:text-orange-400 hover:bg-blue-900/30">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>

            <div className="flex gap-2">
              <Button onClick={handleDownloadPDF} variant="outline" className="border-blue-700 text-blue-200 hover:bg-orange-500 hover:text-white hover:border-orange-500">
                <Download className="h-4 w-4 mr-2" />
                Baixar Ficha PDF
              </Button>
              <Link href={`/dashboard/alunos/${alunoId}/editar`}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2 text-white">{aluno.name}</CardTitle>
                    <Badge variant={statusVariant} className="bg-orange-500 text-white border-orange-600">{statusText}</Badge>
                  </div>
                  <IdCard className="h-8 w-8 text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-200">Email</p>
                      <p className="text-base text-white">{aluno.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-200">Telefone</p>
                      <p className="text-base text-white">{aluno.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IdCard className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-200">BI</p>
                      <p className="text-base text-white">{aluno.bi}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-200">Data de Nascimento</p>
                      <p className="text-base text-white">{new Date(aluno.birthDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-200">Endereço</p>
                      <p className="text-base text-white">{aluno.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {formacao && (
              <Card className="bg-blue-900/30 border-blue-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-orange-400" />
                    <CardTitle className="text-white">Formação Matriculada</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-200">Curso</p>
                      <p className="text-base font-semibold text-white">{formacao.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Categoria</p>
                      <p className="text-base text-white">{formacao.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Duração</p>
                      <p className="text-base text-white">{formacao.duration}h</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Valor</p>
                      <p className="text-base font-semibold text-orange-400">{formacao.price.toLocaleString("pt-AO")} Kz</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-blue-200">Descrição</p>
                      <p className="text-base text-blue-300">{formacao.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {turma && (
              <Card className="bg-blue-900/30 border-blue-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-400" />
                    <CardTitle className="text-white">Turma</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-200">Nome da Turma</p>
                      <p className="text-base font-semibold text-white">{turma.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Horário</p>
                      <p className="text-base text-white">{turma.schedule}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Data de Início</p>
                      <p className="text-base text-white">{new Date(turma.startDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Data de Término</p>
                      <p className="text-base text-white">{new Date(turma.endDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-200">Vagas</p>
                      <p className="text-base text-white">
                        {alunos.filter((a) => a.turmaId === turma.id).length} / {turma.maxStudents} alunos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {pagamentos.length > 0 && (
              <Card className="bg-blue-900/30 border-blue-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-400" />
                    <CardTitle className="text-white">Histórico de Pagamentos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                        <div key={pagamento.id} className="border border-blue-700 rounded-lg p-4 bg-blue-900/20 hover:bg-blue-900/30 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-orange-400">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                              <p className="text-sm text-blue-300">
                                {new Date(pagamento.createdAt).toLocaleDateString("pt-AO")}
                              </p>
                            </div>
                            <Badge variant={statusColor} className="bg-orange-500 text-white border-orange-600">{statusPagamento}</Badge>
                          </div>
                          <Separator className="my-3 bg-blue-700" />
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-blue-200">Método:</span>
                              <span className="ml-2 font-medium text-white">{metodoPagamento}</span>
                            </div>
                            <div>
                              <span className="text-blue-200">Prestações:</span>
                              <span className="ml-2 font-medium text-white">
                                {getStats(pagamento.id).paidCount}/{pagamento.installments}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
