"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { turmaService, formacaoService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Formacao } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

export default function EditarTurmaPage() {
  const router = useRouter()
  const params = useParams()
  const turmaId = params.id as string
  const { user: currentUser } = useAuth()
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    formacaoId: "",
    name: "",
    startDate: "",
    endDate: "",
    schedule: "",
    maxStudents: "",
    currentStudents: "",
    status: "scheduled" as "scheduled" | "in_progress" | "completed",
  })

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router, turmaId])

  const loadData = async (centroId: string) => {
    try {
      const formacoesData = await formacaoService.getAll(centroId)
      setFormacoes(formacoesData)

      const turma = await turmaService.getById(turmaId)
      if (turma) {
        setFormData({
          formacaoId: turma.formacaoId,
          name: turma.name,
          startDate: turma.startDate.toISOString().split("T")[0],
          endDate: turma.endDate.toISOString().split("T")[0],
          schedule: turma.schedule,
          maxStudents: turma.maxStudents.toString(),
          currentStudents: turma.currentStudents.toString(),
          status: (turma.status === "cancelled" ? "scheduled" : turma.status) as "scheduled" | "in_progress" | "completed",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.centroId) return

    setLoading(true)
    try {
      await turmaService.update(turmaId, {
        formacaoId: formData.formacaoId,
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        schedule: formData.schedule,
        maxStudents: Number(formData.maxStudents),
        currentStudents: Number(formData.currentStudents),
        status: formData.status,
      })
      toast({ title: "Turma atualizada com sucesso!" })
      router.push("/dashboard/turmas")
    } catch (error) {
      toast({ title: "Erro ao atualizar turma", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-3xl px-4 md:px-6 py-6 md:py-8">
          <Link href="/dashboard/turmas">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Editar Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="formacaoId">Formação</Label>
                  <Select
                    value={formData.formacaoId}
                    onValueChange={(value) => setFormData({ ...formData, formacaoId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma formação" />
                    </SelectTrigger>
                    <SelectContent>
                      {formacoes.map((formacao) => (
                        <SelectItem key={formacao.id} value={formacao.id}>
                          {formacao.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Horário</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Vagas Totais</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentStudents">Alunos Matriculados</Label>
                    <Input
                      id="currentStudents"
                      type="number"
                      value={formData.currentStudents}
                      onChange={(e) => setFormData({ ...formData, currentStudents: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Link href="/dashboard/turmas" className="flex-1">
                    <Button type="button" variant="outline" className="w-full bg-transparent">
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
