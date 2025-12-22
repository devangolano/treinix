"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { subscriptionService, alunoService, formacaoService, turmaService, pagamentoService } from "@/lib/supabase-services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Calendar, CreditCard, AlertCircle } from "lucide-react"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalFormacoes: 0,
    totalTurmas: 0,
    pagamentosPendentes: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    if (user.role === "super_admin") {
      router.push("/super-admin")
      return
    }

    loadData(user.centroId)
  }, [user, authLoading, router])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)

      // Carregar informações de subscrição
      const subscriptions = await subscriptionService.getByCentroId(centroId)
      const activeSubscription = subscriptions.find((s) => s.status === "active")
      
      if (activeSubscription) {
        const now = new Date()
        const daysRemaining = Math.ceil(
          (activeSubscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        setSubscriptionInfo({
          status: activeSubscription.status,
          daysRemaining,
          endDate: activeSubscription.endDate,
        })
      }

      // Carregar estatísticas
      const [alunos, formacoes, turmas, pagamentos] = await Promise.all([
        alunoService.getAll(centroId),
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
        pagamentoService.getAll(centroId),
      ])

      setStats({
        totalAlunos: alunos.filter((a) => a.status === "active").length,
        totalFormacoes: formacoes.filter((f) => f.status === "active").length,
        totalTurmas: turmas.length,
        pagamentosPendentes: pagamentos.filter((p) => p.status !== "completed").length,
      })
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          {/* Alerta de subscrição */}
          {subscriptionInfo?.status === "trial" &&
            subscriptionInfo.daysRemaining &&
            subscriptionInfo.daysRemaining <= 1 && (
              <Alert className="mb-6 border-yellow-600/50 bg-yellow-600/10">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    <strong>Atenção:</strong> Seu período de teste termina em {subscriptionInfo.daysRemaining} dia
                    {subscriptionInfo.daysRemaining > 1 ? "s" : ""}.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4 bg-transparent"
                    onClick={() => router.push("/dashboard/subscription")}
                  >
                    Renovar Agora
                  </Button>
                </AlertDescription>
              </Alert>
            )}

          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Bem-vindo de volta, {user.name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAlunos}</div>
                <p className="text-xs text-muted-foreground">Alunos ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Formações</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFormacoes}</div>
                <p className="text-xs text-muted-foreground">Cursos disponíveis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Turmas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTurmas}</div>
                <p className="text-xs text-muted-foreground">Turmas ativas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pagamentosPendentes}</div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </CardContent>
            </Card>
          </div>

          {/* Atividade Recente */}
          <div className="mt-6 md:mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <p className="text-sm text-muted-foreground">Acesso rápido às principais funcionalidades</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
                    <a href="/dashboard/alunos">
                      <Users className="h-6 w-6" />
                      <span>Adicionar Aluno</span>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
                    <a href="/dashboard/formacoes">
                      <GraduationCap className="h-6 w-6" />
                      <span>Nova Formação</span>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
                    <a href="/dashboard/turmas">
                      <Calendar className="h-6 w-6" />
                      <span>Criar Turma</span>
                    </a>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
                    <a href="/dashboard/pagamentos">
                      <CreditCard className="h-6 w-6" />
                      <span>Registrar Pagamento</span>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
