"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle, Clock, XCircle, AlertCircle, Loader2, TrendingUp } from "lucide-react"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCentros: 0,
    activeCentros: 0,
    trialCentros: 0,
    expiredCentros: 0,
    pendingSubscriptions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const centros = await centroService.getAll()
      const subscriptions = await Promise.all(
        centros.map((c) => subscriptionService.getByCentroId(c.id))
      )

      const allSubscriptions = subscriptions.flat()

      // Contar centros com trial ATIVO (trialEndsAt no futuro)
      const trialCentros = centros.filter((c) => c.trialEndsAt && new Date(c.trialEndsAt) > new Date()).length
      
      // Contar centros com subscrição ATIVA (status="active")
      const centrosComSubAtiva = centros.filter((c) => {
        const subs = subscriptions.flat()
        const activeSubs = subs.filter((s) => s.centroId === c.id && s.status === "active")
        return activeSubs.length > 0
      }).length

      setStats({
        totalCentros: centros.length,
        activeCentros: centrosComSubAtiva,
        trialCentros: trialCentros,
        expiredCentros: centros.filter((c) => c.subscriptionStatus === "expired").length,
        pendingSubscriptions: allSubscriptions.filter((s) => s.paymentStatus === "pending").length,
      })
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
          <p className="text-slate-300">Carregando estatísticas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Dashboard Super Admin</h1>
        <p className="text-slate-400 mt-2">Visão geral e gerenciamento da plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        {/* Total de Centros */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total de Centros</CardTitle>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCentros}</div>
            <p className="text-xs text-slate-400 mt-1">Centros registrados na plataforma</p>
          </CardContent>
        </Card>

        {/* Centros Ativos */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Centros Ativos</CardTitle>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.activeCentros}</div>
            <p className="text-xs text-slate-400 mt-1">Com subscrição ativa</p>
          </CardContent>
        </Card>

        {/* Em Teste */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Em Período de Teste</CardTitle>
            <div className="bg-cyan-500/20 p-2 rounded-lg">
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{stats.trialCentros}</div>
            <p className="text-xs text-slate-400 mt-1">Utilizando período gratuito</p>
          </CardContent>
        </Card>

        {/* Expirados */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Subscrições Expiradas</CardTitle>
            <div className="bg-red-500/20 p-2 rounded-lg">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.expiredCentros}</div>
            <p className="text-xs text-slate-400 mt-1">Necessitam renovação</p>
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Subscrições Pendentes</CardTitle>
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats.pendingSubscriptions}</div>
            <p className="text-xs text-slate-400 mt-1">Aguardando aprovação</p>
          </CardContent>
        </Card>

        {/* Taxa de Ativação */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Taxa de Ativação</CardTitle>
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {stats.totalCentros > 0 ? Math.round((stats.activeCentros / stats.totalCentros) * 100) : 0}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Centros com subscrição ativa</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Rápidas */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              Ações Necessárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingSubscriptions > 0 && (
              <Link href="/super-admin/subscriptions" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <span className="text-sm text-slate-200">
                    {stats.pendingSubscriptions} subscrição{stats.pendingSubscriptions !== 1 ? 's' : ''} pendente{stats.pendingSubscriptions !== 1 ? 's' : ''}
                  </span>
                  <span className="text-orange-400">→</span>
                </div>
              </Link>
            )}
            {stats.expiredCentros > 0 && (
              <Link href="/super-admin/centros" className="block">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors">
                  <span className="text-sm text-slate-200">
                    {stats.expiredCentros} centro{stats.expiredCentros !== 1 ? 's' : ''} com subscrição expirada
                  </span>
                  <span className="text-red-400">→</span>
                </div>
              </Link>
            )}
            {stats.pendingSubscriptions === 0 && stats.expiredCentros === 0 && (
              <div className="flex items-center gap-2 p-3 text-slate-400">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm">Nenhuma ação necessária no momento</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navegação Rápida */}
        <Card className="bg-linear-to-br from-slate-800 to-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-400" />
              Acesso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/super-admin/centros" className="block">
              <Button className="w-full justify-start gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200">
                <Building2 className="h-4 w-4" />
                Gerenciar Centros
              </Button>
            </Link>
            <Link href="/super-admin/subscriptions" className="block">
              <Button className="w-full justify-start gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200">
                <AlertCircle className="h-4 w-4" />
                Gerenciar Subscrições
              </Button>
            </Link>
            <Link href="/super-admin/relatorios" className="block">
              <Button className="w-full justify-start gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200">
                <TrendingUp className="h-4 w-4" />
                Ver Relatórios
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
