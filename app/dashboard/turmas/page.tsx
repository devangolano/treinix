"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, signOut, getCurrentUser, onAuthStateChange } from "@/lib/supabase-auth"
import { turmaService, formacaoService  } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Calendar, UsersIcon, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Turma, Formacao } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"

export default function TurmasPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      const [turmasData, formacoesData] = await Promise.all([
        turmaService.getAll(centroId),
        formacaoService.getAll(centroId),
      ])
      setTurmas(turmasData)
      setFormacoes(formacoesData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const getFormacaoName = (formacaoId: string) => {
    return formacoes.find((f) => f.id === formacaoId)?.name || "Formação não encontrada"
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return

    try {
      await turmaService.delete(id)
      toast({ title: "Turma excluída com sucesso!" })
      if (currentUser?.centroId) loadData(currentUser.centroId)
    } catch (error) {
      toast({ title: "Erro ao excluir turma", variant: "destructive" })
    }
  }

  if (!currentUser || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      scheduled: { variant: "outline", label: "Agendada" },
      in_progress: { variant: "default", label: "Em Andamento" },
      completed: { variant: "secondary", label: "Concluída" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    }
    return config[status] || config.scheduled
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Turmas</h1>
              <p className="text-muted-foreground">Gerencie as turmas do seu centro</p>
            </div>

            <Link href="/dashboard/turmas/nova">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {turmas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhuma turma cadastrada</p>
                </CardContent>
              </Card>
            ) : (
              turmas.map((turma) => {
                const statusConfig = getStatusBadge(turma.status)
                return (
                  <Card key={turma.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{turma.name}</CardTitle>
                          <p className="text-sm text-muted-foreground font-medium">
                            {getFormacaoName(turma.formacaoId)}
                          </p>
                        </div>
                        <Badge variant={statusConfig.variant} className="shrink-0">
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Período</p>
                            <p className="text-sm font-medium">
                              {turma.startDate.toLocaleDateString("pt-AO")} -{" "}
                              {turma.endDate.toLocaleDateString("pt-AO")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Horário</p>
                            <p className="text-sm font-medium">{turma.schedule}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <UsersIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">Vagas</p>
                            <p className="text-sm font-medium">
                              {turma.currentStudents}/{turma.maxStudents} alunos
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3 border-t">
                        <Link href={`/dashboard/turmas/${turma.id}/editar`} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full bg-transparent">
                            <Pencil className="h-3 w-3 mr-2" />
                            Editar
                          </Button>
                        </Link>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(turma.id)}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
