"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, signOut, getCurrentUser, onAuthStateChange } from "@/lib/supabase-auth"
import { formacaoService  } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Formacao } from "@/lib/types"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"

export default function FormacoesPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    loadFormacoes(currentUser.centroId)
  }, [currentUser, router])

  const loadFormacoes = async (centroId: string) => {
    try {
      setLoading(true)
      const data = await formacaoService.getAll(centroId)
      setFormacoes(data)
    } catch (error) {
      console.error("Erro ao carregar formações:", error)
      toast({ title: "Erro ao carregar formações", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta formação?")) return

    try {
      await formacaoService.delete(id)
      toast({ title: "Formação excluída com sucesso!" })
      if (currentUser?.centroId) loadFormacoes(currentUser.centroId)
    } catch (error) {
      toast({ title: "Erro ao excluir formação", variant: "destructive" })
    }
  }

  if (!currentUser || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Formações</h1>
              <p className="text-muted-foreground">Gerencie os cursos do seu centro</p>
            </div>

            <Link href="/dashboard/formacoes/nova">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Formação
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {formacoes.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhuma formação cadastrada</p>
                </CardContent>
              </Card>
            ) : (
              formacoes.map((formacao) => (
                <Card key={formacao.id} className="hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold leading-tight">{formacao.name}</CardTitle>
                      <Badge variant={formacao.status === "active" ? "default" : "secondary"} className="shrink-0">
                        {formacao.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">{formacao.description}</p>

                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Duração</span>
                        </div>
                        <span className="font-medium">{formacao.duration}h</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço</span>
                        <span className="text-xl font-bold text-primary">
                          {formacao.price.toLocaleString("pt-AO")} Kz
                        </span>
                      </div>

                      <Badge variant="outline" className="w-fit">
                        {formacao.category}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-3 border-t">
                      <Link href={`/dashboard/formacoes/${formacao.id}/editar`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full bg-transparent">
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </Link>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(formacao.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
