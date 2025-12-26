"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { alunoService, formacaoService, turmaService, pagamentoService, pagamentoInstallmentService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Formacao, Turma } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function NovoAlunoPage() {
  const router = useRouter()
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

  const [paymentData, setPaymentData] = useState({
    installments: "1" as "1" | "2",
    paymentMethod: "cash" as "cash" | "transfer" | "multicaixa",
  })

  // Estado para Dialog de pagamento obrigatório
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    alunoData: null as any,
    pagamentoId: null as string | null,
    installmentAmount: 0,
  })
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router])

  const loadData = async (centroId: string) => {
    try {
      const formacoesData = await formacaoService.getAll(centroId)
      const turmasData = await turmaService.getAll(centroId)
      setFormacoes(formacoesData)
      setTurmas(turmasData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    }
  }

  const filteredTurmas = turmas.filter((t) => t.formacaoId === formData.formacaoId)

  const getFormacaoPrice = (id: string) => {
    return formacoes.find((f) => f.id === id)?.price || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.centroId) return

    setLoading(true)
    try {
      const price = getFormacaoPrice(formData.formacaoId)
      const novoAluno = await alunoService.create({
        centroId: currentUser.centroId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bi: formData.bi,
        address: formData.address,
        birthDate: new Date(formData.birthDate),
        status: formData.status,
        formacaoId: formData.formacaoId,
        turmaId: formData.turmaId,
      })

      if (!novoAluno) {
        toast({ title: "Erro ao cadastrar aluno", variant: "destructive" })
        return
      }

      // Criar pagamento
      const installmentCount = Number(paymentData.installments) as 1 | 2

      const novoPagamento = await pagamentoService.create({
        centroId: currentUser.centroId,
        alunoId: novoAluno.id,
        turmaId: formData.turmaId,
        amount: price,
        installments: installmentCount,
        installmentsPaid: 0,
        paymentMethod: paymentData.paymentMethod,
        status: "pending",
      })

      if (!novoPagamento) {
        toast({ title: "Erro ao criar pagamento", variant: "destructive" })
        return
      }

      // Criar prestações
      const dataInicio = new Date()
      await pagamentoInstallmentService.createBatch(
        novoPagamento.id,
        installmentCount,
        price,
        dataInicio
      )

      // Se for 2 prestações, abrir dialog de pagamento obrigatório
      if (installmentCount === 2) {
        setPaymentDialog({
          open: true,
          alunoData: novoAluno,
          pagamentoId: novoPagamento.id,
          installmentAmount: price / 2,
        })
      } else {
        toast({
          title: "Aluno cadastrado com sucesso!",
          description: "Pagamento registrado à vista.",
        })
        router.push("/dashboard/alunos")
      }
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error)
      toast({ title: "Erro ao cadastrar aluno", variant: "destructive" })
      setLoading(false)
    }
  }

  const handleCompleteFirstPayment = async () => {
    if (!paymentDialog.pagamentoId || !currentUser?.centroId) return

    setPaymentLoading(true)
    try {
      // Atualizar status do pagamento para partial
      const pagamentoAtualizado = await pagamentoService.update(paymentDialog.pagamentoId, {
        status: "partial",
        installmentsPaid: 1,
      })

      if (!pagamentoAtualizado) {
        toast({ title: "Erro ao processar pagamento", variant: "destructive" })
        setPaymentLoading(false)
        return
      }

      // Obter prestações e marcar a primeira como paga
      const installments = await pagamentoInstallmentService.getByPagamentoId(paymentDialog.pagamentoId)
      if (installments.length > 0) {
        await pagamentoInstallmentService.markAsPaid(installments[0].id)
      }

      toast({
        title: "Primeira prestação paga com sucesso!",
        description: "Aluno cadastrado e primeira parcela registrada.",
      })

      setPaymentDialog({ open: false, alunoData: null, pagamentoId: null, installmentAmount: 0 })
      setPaymentLoading(false)
  // notificar outras páginas para recarregar dados
  if (typeof window !== "undefined") window.dispatchEvent(new Event("pagamento:updated"))
  setTimeout(() => router.push("/dashboard/alunos"), 500)
    } catch (error) {
      console.error("Erro ao processar pagamento:", error)
      toast({ title: "Erro ao processar pagamento", variant: "destructive" })
      setPaymentLoading(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-4xl py-6 md:py-8 px-4 md:px-6">
          <Link href="/dashboard/alunos">
            <Button variant="ghost" size="sm" className="mb-4 text-blue-300 hover:text-orange-400 hover:bg-blue-900/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Cadastrar Novo Aluno</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Dados Pessoais</h3>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-blue-200 font-semibold">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: João Maria Santos Silva"
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
                        placeholder="aluno@exemplo.com"
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
                        placeholder="+244 912 345 678"
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
                        placeholder="Ex: 123456789"
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
                      placeholder="Rua/Avenida, número, bairro, cidade"
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

                <Separator className="bg-blue-800" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-white">Matrícula</h3>

                  <div className="space-y-2">
                    <Label htmlFor="formacaoId" className="text-blue-200 font-semibold">Formação</Label>
                    <Select
                      value={formData.formacaoId}
                      onValueChange={(value) => setFormData({ ...formData, formacaoId: value, turmaId: "" })}
                      required
                    >
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                        <SelectValue placeholder="Selecione uma formação" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        {formacoes.map((formacao) => (
                          <SelectItem key={formacao.id} value={formacao.id}>
                            {formacao.name} - {formacao.price.toLocaleString("pt-AO")} Kz
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
                      required
                      disabled={!formData.formacaoId}
                    >
                      <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white disabled:opacity-50">
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        {filteredTurmas.length === 0 ? (
                          <div className="p-2 text-sm text-blue-400">Nenhuma turma disponível</div>
                        ) : (
                          filteredTurmas.map((turma) => (
                            <SelectItem key={turma.id} value={turma.id}>
                              {turma.name} ({turma.currentStudents}/{turma.maxStudents} vagas)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.formacaoId && (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Pagamento</h3>

                      <div className="space-y-3">
                        <Label>Forma de Pagamento</Label>
                        <RadioGroup
                          value={paymentData.installments}
                          onValueChange={(value: "1" | "2") => setPaymentData({ ...paymentData, installments: value })}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3 border border-blue-700 rounded-lg p-4 cursor-pointer hover:bg-blue-900/20 transition-colors bg-blue-900/10">
                            <RadioGroupItem value="1" id="installment-1" />
                            <Label htmlFor="installment-1" className="flex-1 cursor-pointer">
                              <div className="font-medium text-white">Pagamento à Vista</div>
                              <div className="text-sm text-blue-300">
                                {getFormacaoPrice(formData.formacaoId).toLocaleString("pt-AO")} Kz
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 border border-blue-700 rounded-lg p-4 cursor-pointer hover:bg-blue-900/20 transition-colors bg-blue-900/10">
                            <RadioGroupItem value="2" id="installment-2" />
                            <Label htmlFor="installment-2" className="flex-1 cursor-pointer">
                              <div className="font-medium text-white">Pagamento em 2 Prestações</div>
                              <div className="text-sm text-blue-300">
                                2x de {(getFormacaoPrice(formData.formacaoId) / 2).toLocaleString("pt-AO")} Kz (sem
                                juros)
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-blue-200 font-semibold">Método de Pagamento</Label>
                        <Select
                          value={paymentData.paymentMethod}
                          onValueChange={(value: "cash" | "transfer" | "multicaixa") =>
                            setPaymentData({ ...paymentData, paymentMethod: value })
                          }
                        >
                          <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-blue-900 border-blue-800">
                            <SelectItem value="cash">Dinheiro</SelectItem>
                            <SelectItem value="transfer">Transferência Bancária</SelectItem>
                            <SelectItem value="multicaixa">Multicaixa Express</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    {loading ? "Cadastrando..." : "Cadastrar Aluno"}
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

      {/* Dialog de Pagamento Obrigatório para 2 Prestações */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => !open && setPaymentDialog({ open: false, alunoData: null, pagamentoId: null, installmentAmount: 0 })}>
        <DialogContent className="sm:max-w-md bg-blue-900/40 border-blue-800">
          <DialogHeader>
            <DialogTitle className="text-white">Pagamento da Primeira Prestação</DialogTitle>
            <DialogDescription className="text-blue-300">
              Confirme o pagamento da primeira prestação para {paymentDialog.alunoData?.name}
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-orange-500 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-300">
              O aluno foi cadastrado com sucesso. Agora é necessário registrar o pagamento da primeira prestação.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-blue-800/40 border border-blue-700 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-300">Aluno:</span>
                  <span className="font-medium text-white">{paymentDialog.alunoData?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-300">Primeira Prestação:</span>
                  <span className="font-bold text-lg text-orange-400">
                    {paymentDialog.installmentAmount.toLocaleString("pt-AO")} Kz
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-lg">
              <p className="text-sm text-orange-300">
                <strong>Nota:</strong> A segunda prestação poderá ser paga posteriormente através da seção de Pagamentos.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPaymentDialog({ open: false, alunoData: null, pagamentoId: null, installmentAmount: 0 })
                setTimeout(() => router.push("/dashboard/alunos"), 500)
              }}
              disabled={paymentLoading}
              className="border-blue-700 text-blue-200 hover:bg-blue-900/30 hover:border-blue-600"
            >
              Registrar Depois
            </Button>
            <Button
              onClick={handleCompleteFirstPayment}
              disabled={paymentLoading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {paymentLoading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

