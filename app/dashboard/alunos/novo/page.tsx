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
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-4xl py-6 md:py-8 px-4 md:px-6">
          <Link href="/dashboard/alunos">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Aluno</CardTitle>
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
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma formação" />
                      </SelectTrigger>
                      <SelectContent>
                        {formacoes.map((formacao) => (
                          <SelectItem key={formacao.id} value={formacao.id}>
                            {formacao.name} - {formacao.price.toLocaleString("pt-AO")} Kz
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
                      required
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
                              {turma.name} ({turma.currentStudents}/{turma.maxStudents} vagas)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.formacaoId && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Valor da Formação:</span>
                        <span className="text-xl font-bold text-primary">
                          {getFormacaoPrice(formData.formacaoId).toLocaleString("pt-AO")} Kz
                        </span>
                      </div>
                    </div>
                  )}
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
                          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                            <RadioGroupItem value="1" id="installment-1" />
                            <Label htmlFor="installment-1" className="flex-1 cursor-pointer">
                              <div className="font-medium">Pagamento à Vista</div>
                              <div className="text-sm text-muted-foreground">
                                {getFormacaoPrice(formData.formacaoId).toLocaleString("pt-AO")} Kz
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors">
                            <RadioGroupItem value="2" id="installment-2" />
                            <Label htmlFor="installment-2" className="flex-1 cursor-pointer">
                              <div className="font-medium">Pagamento em 2 Prestações</div>
                              <div className="text-sm text-muted-foreground">
                                2x de {(getFormacaoPrice(formData.formacaoId) / 2).toLocaleString("pt-AO")} Kz (sem
                                juros)
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Método de Pagamento</Label>
                        <Select
                          value={paymentData.paymentMethod}
                          onValueChange={(value: "cash" | "transfer" | "multicaixa") =>
                            setPaymentData({ ...paymentData, paymentMethod: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Cadastrando..." : "Cadastrar Aluno"}
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

      {/* Dialog de Pagamento Obrigatório para 2 Prestações */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => !open && setPaymentDialog({ open: false, alunoData: null, pagamentoId: null, installmentAmount: 0 })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento da Primeira Prestação</DialogTitle>
            <DialogDescription>
              Confirme o pagamento da primeira prestação para {paymentDialog.alunoData?.name}
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              O aluno foi cadastrado com sucesso. Agora é necessário registrar o pagamento da primeira prestação.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Aluno:</span>
                  <span className="font-medium">{paymentDialog.alunoData?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Primeira Prestação:</span>
                  <span className="font-bold text-lg text-primary">
                    {paymentDialog.installmentAmount.toLocaleString("pt-AO")} Kz
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-sm text-amber-800">
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
            >
              Registrar Depois
            </Button>
            <Button
              onClick={handleCompleteFirstPayment}
              disabled={paymentLoading}
              className="flex-1"
            >
              {paymentLoading ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

