"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { alunoService, formacaoService, turmaService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Formacao, Turma } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

export default function EditarAlunoPage() {
  const router = useRouter()
  const params = useParams()
  const alunoId = params.id as string
  const { user: currentUser } = useAuth()
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bi: "",
    address: "",
    birthDate: "",
    status: "active" as "active" | "inactive",
    formacaoId: "",
    turmaId: "",
  })

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router, alunoId])

  const loadData = async (centroId: string) => {
    try {
      const formacoesData = await formacaoService.getAll(centroId)
      const turmasData = await turmaService.getAll(centroId)
      setFormacoes(formacoesData)
      setTurmas(turmasData)

      const aluno = await alunoService.getById(alunoId)
      if (aluno) {
        setFormData({
          name: aluno.name,
          email: aluno.email,
          phone: aluno.phone,
          bi: aluno.bi,
          address: aluno.address,
          birthDate: aluno.birthDate.toISOString().split("T")[0],
          status: aluno.status,
          formacaoId: aluno.formacaoId || "",
          turmaId: aluno.turmaId || "",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    }
  }

  const filteredTurmas = turmas.filter((t) => t.formacaoId === formData.formacaoId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.centroId) return

    setLoading(true)
    try {
      await alunoService.update(alunoId, {
        ...formData,
        birthDate: new Date(formData.birthDate),
      })
      toast({ title: "Aluno atualizado com sucesso!" })
      router.push("/dashboard/alunos")
    } catch (error) {
      toast({ title: "Erro ao atualizar aluno", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-4xl px-4 md:px-6 py-6 md:py-8">
          <Link href="/dashboard/alunos">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Editar Aluno</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Dados Pessoais</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bi">BI</Label>
                      <Input
                        id="bi"
                        value={formData.bi}
                        onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Matrícula</h3>

                  <div className="space-y-2">
                    <Label htmlFor="formacaoId">Formação</Label>
                    <Select
                      value={formData.formacaoId}
                      onValueChange={(value) => setFormData({ ...formData, formacaoId: value, turmaId: "" })}
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
                    <Label htmlFor="turmaId">Turma</Label>
                    <Select
                      value={formData.turmaId}
                      onValueChange={(value) => setFormData({ ...formData, turmaId: value })}
                      disabled={!formData.formacaoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTurmas.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">Nenhuma turma disponível</div>
                        ) : (
                          filteredTurmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Link href="/dashboard/alunos" className="flex-1">
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
