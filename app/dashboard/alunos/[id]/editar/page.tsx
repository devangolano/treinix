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
  const [loading, setLoading] = useState(true)

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
    setLoading(true)
    try {
      console.log("[EditarAluno] Iniciando carregamento - alunoId:", alunoId, "centroId:", centroId)
      
      const formacoesData = await formacaoService.getAll(centroId)
      const turmasData = await turmaService.getAll(centroId)
      setFormacoes(formacoesData)
      setTurmas(turmasData)

      console.log("[EditarAluno] Tentando buscar aluno diretamente com ID:", alunoId)
      let aluno = await alunoService.getById(alunoId)
      
      // Se não encontrou direto (pode ser problema de RLS), buscar a lista e filtrar
      if (!aluno) {
        console.log("[EditarAluno] Aluno não encontrado direto, tentando buscar da lista de alunos do centro...")
        const alunosList = await alunoService.getAll(centroId)
        aluno = alunosList.find(a => a.id === alunoId) || null
      }
      
      console.log("[EditarAluno] Aluno obtido:", aluno)
      
      if (aluno) {
        let birthDateFormatted = ""
        if (aluno.birthDate) {
          const dateStr = aluno.birthDate instanceof Date 
            ? aluno.birthDate.toISOString()
            : String(aluno.birthDate)
          birthDateFormatted = dateStr.split('T')[0]
        }
        console.log("[EditarAluno] Dados formatados:", {
          name: aluno.name,
          email: aluno.email,
          birthDate: birthDateFormatted,
        })
        setFormData({
          name: aluno.name,
          email: aluno.email,
          phone: aluno.phone,
          bi: aluno.bi,
          address: aluno.address,
          birthDate: birthDateFormatted,
          status: aluno.status,
          formacaoId: "",
          turmaId: "",
        })
      } else {
        console.warn("[EditarAluno] Aluno não encontrado!")
        alert("Aluno não encontrado!")
      }
    } catch (error) {
      console.error("[EditarAluno] Erro ao carregar dados:", error)
     alert("Erro ao carregar dados do aluno.")
    } finally {
      setLoading(false)
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
      alert("Aluno atualizado com sucesso!")
      router.push("/dashboard/alunos")
    } catch (error) {
      alert("Erro ao atualizar aluno")
      console.error("Erro ao atualizar aluno:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return null
  
  if (loading) {
    return (
      <div className="flex h-screen flex-col md:flex-row bg-slate-900">
        <CentroSidebar />
        <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900 flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-4xl px-4 md:px-6 py-6 md:py-8">
          <Link href="/dashboard/alunos">
            <Button variant="ghost" size="sm" className="mb-4 text-blue-300 hover:text-orange-400 hover:bg-blue-900/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Editar Aluno</CardTitle>
            </CardHeader>
            <CardContent >
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Dados Pessoais</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-blue-200 font-semibold">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-200 font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-blue-200 font-semibold">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bi" className="text-blue-200 font-semibold">BI</Label>
                      <Input
                        id="bi"
                        value={formData.bi}
                        onChange={(e) => setFormData({ ...formData, bi: e.target.value })}
                        className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-blue-200 font-semibold">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-blue-200 font-semibold">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-blue-200 font-semibold">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-blue-700" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Matrícula</h3>

                  <div className="space-y-2">
                    <Label htmlFor="formacaoId" className="text-blue-200 font-semibold">Formação</Label>
                    <Select
                      value={formData.formacaoId}
                      onValueChange={(value) => setFormData({ ...formData, formacaoId: value, turmaId: "" })}
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
                    <Label htmlFor="turmaId" className="text-blue-200 font-semibold">Turma</Label>
                    <Select
                      value={formData.turmaId}
                      onValueChange={(value) => setFormData({ ...formData, turmaId: value })}
                      disabled={!formData.formacaoId}
                    >
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white disabled:opacity-50">
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        {filteredTurmas.length === 0 ? (
                          <div className="p-2 text-sm text-blue-300">Nenhuma turma disponível</div>
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
                  <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Link href="/dashboard/alunos" className="flex-1">
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
