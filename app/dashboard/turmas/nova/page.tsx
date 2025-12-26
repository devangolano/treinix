"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export default function NovaTurmaPage() {
  const router = useRouter()
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
    currentStudents: "0",
    status: "scheduled" as "scheduled" | "in_progress" | "completed",
  })

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadFormacoes(currentUser.centroId)
  }, [currentUser, router])

  const loadFormacoes = async (centroId: string) => {
    try {
      const formacoesData = await formacaoService.getAll(centroId)
      setFormacoes(formacoesData)
    } catch (error) {
      console.error("Erro ao carregar formações:", error)
      toast({ title: "Erro ao carregar formações", variant: "destructive" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.centroId) return

    setLoading(true)
    try {
      await turmaService.create({
        centroId: currentUser.centroId,
        formacaoId: formData.formacaoId,
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        schedule: formData.schedule,
        maxStudents: Number(formData.maxStudents),
        currentStudents: Number(formData.currentStudents),
        status: formData.status,
      })
      toast({ title: "Turma criada com sucesso!" })
      router.push("/dashboard/turmas")
    } catch (error) {
      toast({ title: "Erro ao criar turma", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-3xl py-6 md:py-8 px-4 md:px-6">
          <Link href="/dashboard/turmas">
            <Button variant="ghost" size="sm" className="mb-4 text-blue-300 hover:text-orange-400 hover:bg-blue-900/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Nova Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="formacaoId" className="text-blue-200 font-semibold">Formação</Label>
                  <Select
                    value={formData.formacaoId}
                    onValueChange={(value) => setFormData({ ...formData, formacaoId: value })}
                    required
                  >
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                      <SelectValue placeholder="Selecione uma formação" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      {formacoes.map((formacao) => (
                        <SelectItem key={formacao.id} value={formacao.id}>
                          {formacao.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-200 font-semibold">Nome da Turma</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Turma A - Manhã"
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-blue-200 font-semibold">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-blue-200 font-semibold">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule" className="text-blue-200 font-semibold">Horário</Label>
                  <Input
                    id="schedule"
                    placeholder="Ex: Segunda a Sexta, 18h-20h"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents" className="text-blue-200 font-semibold">Vagas Totais</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                      placeholder="30"
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentStudents" className="text-blue-200 font-semibold">Alunos Matriculados</Label>
                    <Input
                      id="currentStudents"
                      type="number"
                      value={formData.currentStudents}
                      onChange={(e) => setFormData({ ...formData, currentStudents: e.target.value })}
                      placeholder="0"
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-blue-200 font-semibold">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="scheduled">Agendada</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    {loading ? "Criando..." : "Criar Turma"}
                  </Button>
                  <Link href="/dashboard/turmas" className="flex-1">
                    <Button type="button" variant="outline" className="w-full border-blue-700 text-blue-200 hover:bg-orange-500 hover:text-white hover:border-orange-500">
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
