"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"

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
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard Super Admin</h1>
            <p className="text-blue-300">Visão geral da plataforma</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">Total de Centros</CardTitle>
                <Building2 className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalCentros}</div>
                <p className="text-xs text-blue-300">Centros registrados</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">Centros Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.activeCentros}</div>
                <p className="text-xs text-blue-300">Com subscrição ativa</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">Em Teste</CardTitle>
                <Clock className="h-4 w-4 text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">{stats.trialCentros}</div>
                <p className="text-xs text-blue-300">Período de teste</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">Expirados</CardTitle>
                <XCircle className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">{stats.expiredCentros}</div>
                <p className="text-xs text-blue-300">Subscrição expirada</p>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white">Subscrições Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">{stats.pendingSubscriptions}</div>
                <p className="text-xs text-blue-300">Aguardando aprovação</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-blue-200">Aprovar subscrições pendentes</span>
                  <a href="/super-admin/subscriptions" className="text-sm text-orange-400 hover:text-orange-300 hover:underline">
                    Ver todas →
                  </a>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-blue-200">Gerenciar centros</span>
                  <a href="/super-admin/centros" className="text-sm text-orange-400 hover:text-orange-300 hover:underline">
                    Ver todos →
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
