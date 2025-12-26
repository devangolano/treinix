"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { centroService, subscriptionService } from "@/lib/supabase-services"
import type { Centro } from "@/lib/types"
import { Phone, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CentrosPage() {
  const [centros, setCentros] = useState<Centro[]>([])
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCentros()
  }, [])

  const loadCentros = async () => {
    try {
      setLoading(true)
      const data = await centroService.getAll()
      setCentros(data)

      // Buscar subscrições ativas para cada centro
      const subsMap: Record<string, any> = {}
      for (const centro of data) {
        try {
          const subs = await subscriptionService.getByCentroId(centro.id)
          // Procurar subscrição que seja "active" OU "pending" com payment_status "approved"
          const activeSub = subs.find(
            (s) => s.status === "active" || (s.status === "pending" && s.paymentStatus === "approved")
          )
          if (activeSub) {
            subsMap[centro.id] = activeSub
            console.log(`[CentrosPage] Subscrição encontrada para ${centro.name}:`, activeSub)
          }
        } catch (error) {
          console.error(`Erro ao buscar subscrição do centro ${centro.id}:`, error)
        }
      }
      setSubscriptions(subsMap)
    } catch (error) {
      console.error("Erro ao carregar centros:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os centros.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Ativo" },
      trial: { variant: "secondary", label: "Teste" },
      expired: { variant: "destructive", label: "Expirado" },
      blocked: { variant: "destructive", label: "Bloqueado" },
      pending: { variant: "outline", label: "Pendente" },
    }
    const config = variants[status] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Gestão de Centros</h1>
            <p className="text-blue-300">Gerencie todos os centros de formação registrados</p>
          </div>

          {centros.length === 0 ? (
            <Card className="bg-blue-900/30 border-blue-800">
              <CardContent className="py-8 text-center">
                <p className="text-blue-300">Nenhum centro registrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {centros.map((centro) => {
                const planEndDate = subscriptions[centro.id]?.endDate || centro.trialEndsAt
                const planEndDateStr = planEndDate
                  ? new Date(planEndDate).toLocaleDateString("pt-AO")
                  : "-"

                return (
                  <Link key={centro.id} href={`/super-admin/centros/${centro.id}`}>
                    <Card className="bg-blue-900/30 border-blue-800 hover:bg-blue-900/50 hover:border-orange-500 transition-all cursor-pointer">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          {/* Informação Principal: Nome */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">{centro.name}</h3>
                          </div>

                          {/* Telefone */}
                          <div className="flex items-center gap-2 text-blue-300 mx-4 whitespace-nowrap">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{centro.phone}</span>
                          </div>

                          {/* Status */}
                          <div className="mx-4">
                            {getStatusBadge(centro.subscriptionStatus)}
                          </div>

                          {/* Término do Plano */}
                          <div className="text-right mx-4">
                            <p className="text-xs text-blue-300">Término do plano</p>
                            <p className="text-sm font-semibold text-white">{planEndDateStr}</p>
                          </div>

                          {/* Seta */}
                          <ChevronRight className="h-5 w-5 text-blue-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
