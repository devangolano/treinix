"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { centroService } from "@/lib/supabase-services"
import type { Centro } from "@/lib/types"
import { Lock, Unlock, Phone, Mail, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CentrosPage() {
  const [centros, setCentros] = useState<Centro[]>([])
  const [loading, setLoading] = useState(true)
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadCentros()
  }, [])

  const loadCentros = async () => {
    try {
      setLoading(true)
      const data = await centroService.getAll()
      setCentros(data)
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

  const handleBlock = async (centroId: string) => {
    setBlockingId(centroId)
    try {
      await centroService.update(centroId, { subscriptionStatus: "blocked" })
      await loadCentros()
      toast({
        title: "Centro bloqueado",
        description: "O centro foi bloqueado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível bloquear o centro.",
        variant: "destructive",
      })
    } finally {
      setBlockingId(null)
    }
  }

  const handleUnblock = async (centroId: string) => {
    setBlockingId(centroId)
    try {
      await centroService.update(centroId, { subscriptionStatus: "active" })
      await loadCentros()
      toast({
        title: "Centro desbloqueado",
        description: "O centro foi desbloqueado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desbloquear o centro.",
        variant: "destructive",
      })
    } finally {
      setBlockingId(null)
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
            <div className="space-y-4">
              {centros.map((centro) => (
                <Card key={centro.id} className="bg-blue-900/30 border-blue-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl text-white">{centro.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-blue-300">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {centro.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {centro.phone}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(centro.subscriptionStatus)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-400 mt-0.5" />
                        <p className="text-sm text-blue-200">{centro.address}</p>
                      </div>

                      {centro.nif && (
                        <div className="text-sm">
                          <p className="text-blue-300">NIF</p>
                          <p className="font-mono text-white">{centro.nif}</p>
                        </div>
                      )}

                      <div className="text-sm">
                        <p className="text-blue-300">Data de Criação</p>
                        <p className="text-white">{new Date(centro.createdAt).toLocaleDateString("pt-AO")}</p>
                      </div>

                      {centro.trialEndsAt && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Teste termina em</p>
                          <p>{new Date(centro.trialEndsAt).toLocaleDateString("pt-AO")}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        {centro.subscriptionStatus === "blocked" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblock(centro.id)}
                            disabled={blockingId === centro.id}
                            className="gap-2"
                          >
                            <Unlock className="h-4 w-4" />
                            Desbloquear
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlock(centro.id)}
                            disabled={blockingId === centro.id}
                            className="gap-2"
                          >
                            <Lock className="h-4 w-4" />
                            Bloquear
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
