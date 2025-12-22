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

      setStats({
        totalCentros: centros.length,
        activeCentros: centros.filter((c) => c.subscriptionStatus === "active").length,
        trialCentros: centros.filter((c) => c.subscriptionStatus === "trial").length,
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
      <div className="flex h-screen">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Dashboard Super Admin</h1>
            <p className="text-muted-foreground">Visão geral da plataforma</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Centros</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCentros}</div>
                <p className="text-xs text-muted-foreground">Centros registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Centros Ativos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.activeCentros}</div>
                <p className="text-xs text-muted-foreground">Com subscrição ativa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Em Teste</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.trialCentros}</div>
                <p className="text-xs text-muted-foreground">Período de teste</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expirados</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.expiredCentros}</div>
                <p className="text-xs text-muted-foreground">Subscrição expirada</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Subscrições Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingSubscriptions}</div>
                <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Aprovar subscrições pendentes</span>
                  <a href="/super-admin/subscriptions" className="text-sm text-primary hover:underline">
                    Ver todas →
                  </a>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Gerenciar centros</span>
                  <a href="/super-admin/centros" className="text-sm text-primary hover:underline">
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
