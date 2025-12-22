"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService } from "@/lib/supabase-services"
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
import type { Aluno, Formacao, Turma, Pagamento } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export default function DetalhesAlunoPage() {
  const router = useRouter()
  const params = useParams()
  const alunoId = params.id as string
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [formacao, setFormacao] = useState<Formacao | null>(null)
  const [turma, setTurma] = useState<Turma | null>(null)
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

  const handleDownloadPDF = () => {
    if (!aluno) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const statusText = aluno.status === "active" ? "Ativo" : "Inativo"
    const statusColor = aluno.status === "active" ? "#10b981" : "#ef4444"

    const totalPago = pagamentos.reduce((sum, p) => sum + (p.amount * p.installmentsPaid) / p.installments, 0)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha do Aluno - ${aluno.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .header h1 { color: #2563eb; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .section { margin-bottom: 25px; }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 15px; 
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin-bottom: 10px; }
          .info-label { font-weight: bold; color: #555; font-size: 13px; display: block; margin-bottom: 3px; }
          .info-value { color: #333; font-size: 14px; }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background-color: ${statusColor};
          }
          .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 2px solid #e5e7eb; 
            text-align: center; 
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Formação-Ao</h1>
          <p>Ficha do Aluno</p>
        </div>

        <div class="section">
          <div class="section-title">Informações Pessoais</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Nome Completo</span>
              <span class="info-value">${aluno.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="status-badge">${statusText}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">${aluno.email}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Telefone</span>
              <span class="info-value">${aluno.phone}</span>
            </div>
            <div class="info-item">
              <span class="info-label">BI</span>
              <span class="info-value">${aluno.bi}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Data de Nascimento</span>
              <span class="info-value">${new Date(aluno.birthDate).toLocaleDateString("pt-AO")}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="info-label">Endereço</span>
              <span class="info-value">${aluno.address}</span>
            </div>
          </div>
        </div>

        ${
          formacao
            ? `
          <div class="section">
            <div class="section-title">Formação Matriculada</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Curso</span>
                <span class="info-value">${formacao.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Categoria</span>
                <span class="info-value">${formacao.category}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Duração</span>
                <span class="info-value">${formacao.duration}h</span>
              </div>
              <div class="info-item">
                <span class="info-label">Valor</span>
                <span class="info-value">${formacao.price.toLocaleString("pt-AO")} Kz</span>
              </div>
            </div>
          </div>
        `
            : ""
        }

        ${
          turma
            ? `
          <div class="section">
            <div class="section-title">Turma</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nome da Turma</span>
                <span class="info-value">${turma.name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Horário</span>
                <span class="info-value">${turma.schedule}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data de Início</span>
                <span class="info-value">${new Date(turma.startDate).toLocaleDateString("pt-AO")}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Data de Término</span>
                <span class="info-value">${new Date(turma.endDate).toLocaleDateString("pt-AO")}</span>
              </div>
            </div>
          </div>
        `
            : ""
        }

        ${
          pagamentos.length > 0
            ? `
          <div class="section">
            <div class="section-title">Histórico de Pagamentos</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Total de Pagamentos</span>
                <span class="info-value">${pagamentos.length}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Valor Total Pago</span>
                <span class="info-value">${totalPago.toLocaleString("pt-AO")} Kz</span>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleDateString("pt-AO")} às ${new Date().toLocaleTimeString("pt-AO")}</p>
          <p>Formação-Ao - Sistema de Gestão de Centros de Formação</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  if (!currentUser || !aluno) return null

  const statusText = aluno.status === "active" ? "Ativo" : "Inativo"
  const statusVariant = aluno.status === "active" ? "default" : "secondary"

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-5xl px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard/alunos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>

            <div className="flex gap-2">
              <Button onClick={handleDownloadPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Baixar Ficha PDF
              </Button>
              <Link href={`/dashboard/alunos/${alunoId}/editar`}>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{aluno.name}</CardTitle>
                    <Badge variant={statusVariant}>{statusText}</Badge>
                  </div>
                  <IdCard className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-base">{aluno.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="text-base">{aluno.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <IdCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">BI</p>
                      <p className="text-base">{aluno.bi}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                      <p className="text-base">{new Date(aluno.birthDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Endereço</p>
                      <p className="text-base">{aluno.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {formacao && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    <CardTitle>Formação Matriculada</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Curso</p>
                      <p className="text-base font-semibold">{formacao.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Categoria</p>
                      <p className="text-base">{formacao.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duração</p>
                      <p className="text-base">{formacao.duration}h</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor</p>
                      <p className="text-base font-semibold">{formacao.price.toLocaleString("pt-AO")} Kz</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-base text-muted-foreground">{formacao.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {turma && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Turma</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nome da Turma</p>
                      <p className="text-base font-semibold">{turma.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Horário</p>
                      <p className="text-base">{turma.schedule}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
                      <p className="text-base">{new Date(turma.startDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Término</p>
                      <p className="text-base">{new Date(turma.endDate).toLocaleDateString("pt-AO")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Vagas</p>
                      <p className="text-base">
                        {alunos.filter((a) => a.turmaId === turma.id).length} / {turma.maxStudents} alunos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {pagamentos.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <CardTitle>Histórico de Pagamentos</CardTitle>
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
                        <div key={pagamento.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold">{pagamento.amount.toLocaleString("pt-AO")} Kz</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(pagamento.createdAt).toLocaleDateString("pt-AO")}
                              </p>
                            </div>
                            <Badge variant={statusColor}>{statusPagamento}</Badge>
                          </div>
                          <Separator className="my-3" />
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Método:</span>
                              <span className="ml-2 font-medium">{metodoPagamento}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prestações:</span>
                              <span className="ml-2 font-medium">
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
