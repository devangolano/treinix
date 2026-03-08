"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { certificadoService, alunoService, formacaoService, turmaService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"
import type { Certificado, Aluno, Formacao, Turma } from "@/lib/types"
import { useConfirm } from "@/hooks/use-confirm"
import { ConfirmDialog } from "@/components/confirm-dialog"

export default function EditarCertificadoPage() {
  const { openConfirm, open, options, handleConfirm, handleCancel } = useConfirm()
  const router = useRouter()
  const params = useParams()
  const certificadoId = params.id as string
  const { user, isLoading: authLoading } = useAuth()

  const [certificado, setCertificado] = useState<Certificado | null>(null)
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [notaFinal, setNotaFinal] = useState("")
  const [estado, setEstado] = useState<"emitido" | "em_andamento" | "pronto">("emitido")

  useEffect(() => {
    if (authLoading) return

    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    loadData(user.centroId)
  }, [user, authLoading, router])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      setError(null)

      const [cert, alunosData, formacoesData, turmasData] = await Promise.all([
        certificadoService.getById(certificadoId),
        alunoService.getAll(centroId),
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
      ])

      if (!cert) {
        setError("Certificado não encontrado")
        return
      }

      setCertificado(cert)
      setNotaFinal(cert.notaFinal.toString())
      setEstado(cert.estado || "emitido")
      setAlunos(alunosData)
      setFormacoes(formacoesData)
      setTurmas(turmasData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      console.error("Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async () => {
    if (!certificado) return

    if (!notaFinal || isNaN(parseFloat(notaFinal))) {
      toast.error("Por favor, preencha a nota final com um número válido")
      return
    }

    try {
      setSalvando(true)

      const success = await certificadoService.update(certificado.id, {
        ...certificado,
        notaFinal: parseFloat(notaFinal),
        estado,
      })

      if (success) {
        toast.success("Certificado atualizado com sucesso!")
        router.push("/dashboard/certificados")
      } else {
        toast.error("Erro ao atualizar certificado")
      }
    } catch (err) {
      console.error("Erro ao salvar certificado:", err)
      toast.error("Erro ao atualizar certificado")
    } finally {
      setSalvando(false)
    }
  }

  const handleDeletar = async () => {
    if (!certificado) return

    const confirmed = await openConfirm({
      title: "Tem certeza que deseja deletar este certificado? Esta ação não pode ser desfeita.",
      isDangerous: true
    })
    if (!confirmed) {
      return
    }

    try {
      setSalvando(true)

      const success = await certificadoService.delete(certificado.id)

      if (success) {
        toast.success("Certificado deletado com sucesso!")
        router.push("/dashboard/certificados")
      } else {
        toast.error("Erro ao deletar certificado")
      }
    } catch (err) {
      console.error("Erro ao deletar certificado:", err)
      toast.error("Erro ao deletar certificado")
    } finally {
      setSalvando(false)
    }
  }

  const getNomeAluno = (alunoId: string) => {
    return alunos.find((a) => a.id === alunoId)?.name || "N/A"
  }

  const getNomeFormacao = (formacaoId: string) => {
    return formacoes.find((f) => f.id === formacaoId)?.name || "N/A"
  }

  const getNomeTurma = (turmaId: string) => {
    return turmas.find((t) => t.id === turmaId)?.name || "N/A"
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <CentroSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <div className="flex h-screen flex-col md:flex-row bg-slate-900">
        <CentroSidebar />
        <div className="flex-1 flex items-center justify-center pt-16 md:pt-0 bg-slate-900">
          <Card className="w-full max-w-md mx-4 bg-blue-900/30 border-blue-700">
            <CardContent className="pt-6">
              <p className="text-red-400 text-center">{error}</p>
              <Link href="/dashboard/certificados" className="block mt-4">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">Voltar</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!certificado) return null

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-2xl py-6 md:py-8 px-4 md:px-6">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/certificados">
              <Button variant="ghost" size="sm" className="text-blue-300 hover:text-white hover:bg-blue-800">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Editar Certificado</h1>
              <p className="text-blue-200">{getNomeAluno(certificado.alunoId)}</p>
            </div>
          </div>

          {/* Formulário */}
          <Card className="bg-blue-900/30 border-blue-700">
            <CardHeader className="border-b border-blue-700 pb-4">
              <CardTitle className="text-white">Informações do Certificado</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Informações de apenas leitura */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-blue-700">
                  <div>
                    <Label className="text-blue-300 text-sm font-medium">Aluno</Label>
                    <p className="text-white mt-2 bg-blue-800/50 p-2 rounded border border-blue-700">
                      {getNomeAluno(certificado.alunoId)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-blue-300 text-sm font-medium">Formação</Label>
                    <p className="text-white mt-2 bg-blue-800/50 p-2 rounded border border-blue-700">
                      {getNomeFormacao(certificado.formacaoId)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-blue-300 text-sm font-medium">Turma</Label>
                    <p className="text-white mt-2 bg-blue-800/50 p-2 rounded border border-blue-700">
                      {getNomeTurma(certificado.turmaId)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-blue-300 text-sm font-medium">Data de Emissão</Label>
                    <p className="text-white mt-2 bg-blue-800/50 p-2 rounded border border-blue-700">
                      {formatDate(certificado.dataEmissao)}
                    </p>
                  </div>
                </div>

                {/* Campos editáveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-blue-700">
                  <div>
                    <Label htmlFor="notaFinal" className="text-blue-300 text-sm font-medium">
                      Nota Final
                    </Label>
                    <Input
                      id="notaFinal"
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={notaFinal}
                      onChange={(e) => setNotaFinal(e.target.value)}
                      placeholder="Ex: 18.5"
                      className="mt-2 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-400 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="estado" className="text-blue-300 text-sm font-medium">
                      Estado
                    </Label>
                    <Select value={estado} onValueChange={(valor) => setEstado(valor as any)}>
                      <SelectTrigger className="mt-2 bg-blue-800/40 border-blue-700 text-white focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-800">
                        <SelectItem value="emitido">Emitido</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="pronto">Pronto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* PDF URL (somente leitura) */}
                {certificado.pdfUrl && (
                  <div className="pb-6 border-b border-blue-700">
                    <Label className="text-blue-300 text-sm font-medium">URL do PDF</Label>
                    <p className="text-blue-200 mt-2 text-xs break-all bg-blue-800/50 p-2 rounded border border-blue-700">
                      {certificado.pdfUrl}
                    </p>
                    <Button
                      onClick={() => window.open(certificado.pdfUrl, "_blank")}
                      variant="outline"
                      size="sm"
                      className="mt-2 border-blue-600 text-blue-300 hover:bg-blue-800"
                    >
                      Abrir PDF
                    </Button>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex gap-3 justify-between">
                  <Button
                    onClick={handleDeletar}
                    disabled={salvando}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </Button>

                  <div className="flex gap-2">
                    <Link href="/dashboard/certificados">
                      <Button variant="outline" className="border-blue-600 text-blue-300 hover:bg-blue-800">
                        Cancelar
                      </Button>
                    </Link>

                    <Button
                      onClick={handleSalvar}
                      disabled={salvando}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {salvando ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    
      <ConfirmDialog
        open={open}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText || "Deletar"}
        cancelText={options.cancelText || "Cancelar"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDangerous={options.isDangerous}
      />
    </div>
  )
}
