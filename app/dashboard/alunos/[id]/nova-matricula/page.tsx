"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { alunoService, formacaoService, turmaService, matriculaService, pagamentoService, pagamentoInstallmentService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Formacao, Turma, Aluno } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

export default function NovaMatriculaPage() {
  const router = useRouter()
  const params = useParams()
  const alunoId = params.id as string
  const { user: currentUser } = useAuth()
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [matriculaData, setMatriculaData] = useState({
    formacaoId: "",
    turmaId: "",
  })

  const [paymentData, setPaymentData] = useState({
    installments: "1" as "1" | "2",
    paymentMethod: "cash" as "cash" | "transfer" | "multicaixa",
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
      // Buscar aluno
      let alunoData = await alunoService.getById(alunoId)
      if (!alunoData) {
        const alunosList = await alunoService.getAll(centroId)
        alunoData = alunosList.find(a => a.id === alunoId) || null
      }

      if (!alunoData) {
        toast({ title: "Aluno não encontrado", variant: "destructive" })
        router.push("/dashboard/alunos")
        return
      }

      setAluno(alunoData)

      // Buscar formações e turmas
      const formacoesData = await formacaoService.getAll(centroId)
      const turmasData = await turmaService.getAll(centroId)
      setFormacoes(formacoesData)
      setTurmas(turmasData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredTurmas = turmas.filter((t) => t.formacaoId === matriculaData.formacaoId)

  const getFormacaoPrice = (id: string) => {
    return formacoes.find((f) => f.id === id)?.price || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser?.centroId || !aluno) {
      toast({ title: "Erro", description: "Dados incompletos", variant: "destructive" })
      return
    }

    if (!matriculaData.formacaoId || !matriculaData.turmaId) {
      toast({ title: "Erro", description: "Selecione a formação e turma", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const price = getFormacaoPrice(matriculaData.formacaoId)
      console.log("[NovaMatricula] Iniciando criação de matrícula com preço:", price)

      // 1. Criar matrícula
      console.log("[NovaMatricula] 1. Criando matrícula...")
      const matricula = await matriculaService.create({
        alunoId: aluno.id,
        centroId: currentUser.centroId,
        formacaoId: matriculaData.formacaoId,
        turmaId: matriculaData.turmaId,
        status: "active",
        enrollmentDate: new Date(),
      })

      if (!matricula) {
        throw new Error("Erro ao criar matrícula")
      }
      console.log("[NovaMatricula] ✓ Matrícula criada:", matricula.id)

      // 2. Criar pagamento vinculado à matrícula
      console.log("[NovaMatricula] 2. Criando pagamento...")
      const installmentAmount = price / parseInt(paymentData.installments)
      console.log("[NovaMatricula] Dados do pagamento:", {
        centroId: currentUser.centroId,
        alunoId: aluno.id,
        matriculaId: matricula.id,
        turmaId: matriculaData.turmaId,
        amount: price,
        installments: parseInt(paymentData.installments),
        installmentsPaid: 0,
        status: "pending",
        paymentMethod: paymentData.paymentMethod,
      })

      const pagamento = await pagamentoService.create({
        centroId: currentUser.centroId,
        alunoId: aluno.id,
        matriculaId: matricula.id,
        turmaId: matriculaData.turmaId,
        amount: price,
        installments: parseInt(paymentData.installments) as 1 | 2,
        installmentsPaid: 0,
        status: "pending",
        paymentMethod: paymentData.paymentMethod,
      })

      if (!pagamento) {
        throw new Error("Erro ao criar pagamento")
      }
      console.log("[NovaMatricula] ✓ Pagamento criado:", pagamento.id)

      // 3. Criar prestações usando createBatch
      console.log("[NovaMatricula] 3. Criando prestações...")
      const dataInicio = new Date()
      const installments = await pagamentoInstallmentService.createBatch(
        pagamento.id,
        parseInt(paymentData.installments),
        pagamento.amount,
        dataInicio
      )
      console.log("[NovaMatricula] ✓ Prestações criadas:", installments.length)

      toast({ title: "Matrícula criada com sucesso!" })
      router.push("/dashboard/alunos")
    } catch (error) {
      console.error("Erro ao criar matrícula:", error)
      toast({ title: "Erro ao criar matrícula", variant: "destructive" })
    } finally {
      setSubmitting(false)
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

  if (!aluno) {
    return (
      <div className="flex h-screen flex-col md:flex-row bg-slate-900">
        <CentroSidebar />
        <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900 flex items-center justify-center">
          <div className="text-red-400">Aluno não encontrado</div>
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
              <CardTitle className="text-white text-2xl">Nova Matrícula</CardTitle>
              <p className="text-blue-300 text-sm mt-2">Aluno: {aluno.name}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Dados do Aluno */}
                <div className="bg-blue-800/20 p-4 rounded border border-blue-700">
                  <h3 className="font-semibold text-lg text-white mb-3">Dados do Aluno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-blue-200 font-semibold">Nome</Label>
                      <Input value={aluno.name} disabled className="bg-blue-800/40 border-blue-700 text-blue-100" />
                    </div>
                    <div>
                      <Label className="text-blue-200 font-semibold">Email</Label>
                      <Input value={aluno.email} disabled className="bg-blue-800/40 border-blue-700 text-blue-100" />
                    </div>
                    <div>
                      <Label className="text-blue-200 font-semibold">Telefone</Label>
                      <Input value={aluno.phone} disabled className="bg-blue-800/40 border-blue-700 text-blue-100" />
                    </div>
                    <div>
                      <Label className="text-blue-200 font-semibold">BI</Label>
                      <Input value={aluno.bi} disabled className="bg-blue-800/40 border-blue-700 text-blue-100" />
                    </div>
                  </div>
                </div>

                <Separator className="bg-blue-700" />

                {/* Dados da Matrícula */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Matrícula</h3>

                  <div className="space-y-2">
                    <Label htmlFor="formacaoId" className="text-blue-200 font-semibold">Formação</Label>
                    <Select
                      value={matriculaData.formacaoId}
                      onValueChange={(value) => setMatriculaData({ ...matriculaData, formacaoId: value, turmaId: "" })}
                    >
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                        <SelectValue placeholder="Selecione uma formação" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        {formacoes.map((formacao) => (
                          <SelectItem key={formacao.id} value={formacao.id}>
                            {formacao.name} - AOA {formacao.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="turmaId" className="text-blue-200 font-semibold">Turma</Label>
                    <Select
                      value={matriculaData.turmaId}
                      onValueChange={(value) => setMatriculaData({ ...matriculaData, turmaId: value })}
                      disabled={!matriculaData.formacaoId}
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

                <Separator className="bg-blue-700" />

                {/* Dados de Pagamento */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Pagamento</h3>

                  <div className="space-y-2">
                    <Label className="text-blue-200 font-semibold">Número de Prestações</Label>
                    <RadioGroup value={paymentData.installments} onValueChange={(value: any) => setPaymentData({ ...paymentData, installments: value })}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="installments-1" />
                        <Label htmlFor="installments-1" className="text-blue-200 cursor-pointer">
                          1 Prestação
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="2" id="installments-2" />
                        <Label htmlFor="installments-2" className="text-blue-200 cursor-pointer">
                          2 Prestações
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod" className="text-blue-200 font-semibold">Método de Pagamento</Label>
                    <Select value={paymentData.paymentMethod} onValueChange={(value: any) => setPaymentData({ ...paymentData, paymentMethod: value })}>
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        <SelectItem value="cash">Dinheiro</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                        <SelectItem value="multicaixa">Multicaixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {matriculaData.formacaoId && (
                    <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded">
                      <p className="text-blue-200">
                        <span className="font-semibold text-white">Valor Total:</span> AOA {getFormacaoPrice(matriculaData.formacaoId).toFixed(2)}
                      </p>
                      <p className="text-blue-200 text-sm">
                        <span className="font-semibold">Por Prestação:</span> AOA {(getFormacaoPrice(matriculaData.formacaoId) / parseInt(paymentData.installments)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    {submitting ? "Criando..." : "Criar Matrícula"}
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
