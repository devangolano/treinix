"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import {
  certificadoService,
  alunoService,
  formacaoService,
  turmaService,
  matriculaService,
} from "@/lib/supabase-services"
import { supabase } from "@/lib/supabase"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { Aluno, Formacao, Turma, Matricula } from "@/lib/types"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NovoCertificadoPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [matriculas, setMatriculas] = useState<Matricula[]>([])

  const [formacaoSelecionada, setFormacaoSelecionada] = useState<string>("")
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("")
  const [alunoSelecionado, setAlunoSelecionado] = useState<string>("")
  const [notaFinal, setNotaFinal] = useState<string>("")
  const [estado, setEstado] = useState<"emitido" | "em_andamento" | "pronto">("emitido")
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const [formacoesData, turmasData, alunosData, matriculasData] = await Promise.all([
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
        alunoService.getAll(centroId),
        matriculaService.getAll(centroId),
      ])

      setFormacoes(formacoesData)
      setTurmas(turmasData)
      setAlunos(alunosData)
      setMatriculas(matriculasData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      console.error("Erro ao carregar dados:", err)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar turmas baseado na formação selecionada
  const turmasFiltradas = formacaoSelecionada
    ? turmas.filter((t) => t.formacaoId === formacaoSelecionada)
    : []

  // Filtrar alunos baseado na formação e turma selecionadas
  const alunosFiltrados = formacaoSelecionada && turmaSelecionada
      ? alunos.filter((aluno) => {
          const alunoMatriculas = matriculas.filter((m) => m.alunoId === aluno.id)
          return alunoMatriculas.some(
            (m) => m.formacaoId === formacaoSelecionada && m.turmaId === turmaSelecionada && m.status === "active"
          )
        })
      : formacaoSelecionada
        ? alunos.filter((aluno) => {
            const alunoMatriculas = matriculas.filter((m) => m.alunoId === aluno.id)
            return alunoMatriculas.some((m) => m.formacaoId === formacaoSelecionada && m.status === "active")
          })
        : []

  const handleSalvar = async () => {
    if (!formacaoSelecionada || !alunoSelecionado || !notaFinal) {
      toast.error("Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (parseFloat(notaFinal) < 0 || parseFloat(notaFinal) > 20) {
      toast.error("A nota final deve estar entre 0 e 20")
      return
    }

    if (!user?.centroId) {
      toast.error("Centro não identificado")
      return
    }

    try {
      setSalvando(true)

      // Encontrar a matrícula do aluno na formação e turma selecionadas
      const matricula = matriculas.find(
        (m) =>
          m.alunoId === alunoSelecionado &&
          m.formacaoId === formacaoSelecionada &&
          (turmaSelecionada === "" || m.turmaId === turmaSelecionada)
      )

      if (!matricula) {
        toast.error("Matrícula não encontrada para este aluno")
        return
      }

      // Preparar dados do certificado
      let pdfUrl = undefined
      
      // Se houver arquivo PDF, fazer upload para Supabase Storage
      if (pdfFile) {
        try {
          const timestamp = Date.now()
          const nomeArquivo = pdfFile.name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "")
          const fileName = `${user.centroId}/${timestamp}-${nomeArquivo}`
          
          console.log("Iniciando upload do PDF para Supabase Storage...")
          console.log("Bucket: certificados-pdfs")
          console.log("Arquivo: ", fileName)
          
          // Fazer upload do arquivo para Supabase Storage
          const { data, error: uploadError } = await supabase.storage
            .from("certificados-pdfs")
            .upload(fileName, pdfFile, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error("Erro ao fazer upload do PDF:", uploadError)
            toast.error(`Erro ao fazer upload: ${uploadError.message}. Certificado será criado sem PDF.`)
          } else if (data) {
            // Obter URL pública do arquivo
            const { data: urlData } = supabase.storage
              .from("certificados-pdfs")
              .getPublicUrl(fileName)
            
            if (urlData) {
              pdfUrl = urlData.publicUrl
              console.log("PDF enviado com sucesso:", pdfUrl)
            }
          }
        } catch (err) {
          console.error("Erro ao processar PDF:", err)
          const errorMsg = err instanceof Error ? err.message : "Erro desconhecido"
          toast.error(`Erro ao processar PDF: ${errorMsg}. Certificado será criado sem PDF.`)
        }
      }

      const novoCertificado = await certificadoService.create({
        centroId: user.centroId,
        alunoId: alunoSelecionado,
        matriculaId: matricula.id,
        formacaoId: formacaoSelecionada,
        turmaId: matricula.turmaId,
        notaFinal: parseFloat(notaFinal),
        dataEmissao: new Date(),
        estado: estado,
        pdfUrl: pdfUrl,
        status: "active",
      })

      if (novoCertificado) {
        toast.success("Certificado emitido com sucesso!")
        router.push("/dashboard/certificados")
      } else {
        toast.error("Erro ao emitir certificado")
      }
    } catch (err) {
      console.error("Erro ao salvar certificado:", err)
      toast.error("Erro ao emitir certificado")
    } finally {
      setSalvando(false)
    }
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

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container w-full py-6 md:py-8 px-4 md:px-6">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <Link href="/dashboard/certificados">
              <Button variant="ghost" size="sm" className="text-blue-200 hover:text-white hover:bg-blue-800/50">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Novo Certificado</h1>
              <p className="text-blue-200">Emita um novo certificado para um aluno</p>
            </div>
          </div>

          <Card className="bg-blue-900/40 max-w-4xl w-full border-blue-800">
            <CardHeader>
              <CardTitle className="text-white">Dados do Certificado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 grid grid-cols-3">
              {/* Formação */}
              <div className="space-y-2">
                <Label className="text-blue-200 font-semibold">Formação *</Label>
                <Select value={formacaoSelecionada} onValueChange={setFormacaoSelecionada}>
                  <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                    <SelectValue placeholder="Selecione uma formação" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-900 border-blue-800">
                    {formacoes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turma */}
              {formacaoSelecionada && (
                <div className="space-y-2">
                  <Label className="text-blue-200 font-semibold">Turma (Opcional)</Label>
                  <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      {turmasFiltradas.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {turmaSelecionada && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTurmaSelecionada("")}
                      className="text-xs text-blue-300 hover:text-blue-100 p-0 h-auto"
                    >
                      Limpar seleção
                    </Button>
                  )}
                </div>
              )}

              {/* Aluno */}
              {formacaoSelecionada && (
                <div className="space-y-2">
                  <Label className="text-blue-200 font-semibold">Aluno *</Label>
                  <Select value={alunoSelecionado} onValueChange={setAlunoSelecionado}>
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      {alunosFiltrados.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {alunosFiltrados.length === 0 && formacaoSelecionada && (
                    <p className="text-sm text-yellow-400">
                      Nenhum aluno encontrado para esta formação
                      {turmaSelecionada && " e turma"}
                    </p>
                  )}
                </div>
              )}

              {/* Nota Final */}
              {alunoSelecionado && (
                <div className="space-y-2">
                  <Label className="text-blue-200 font-semibold">Nota Final (0-20) *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="Digite a nota final"
                    value={notaFinal}
                    onChange={(e) => setNotaFinal(e.target.value)}
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-blue-300">Escala: 0 a 20</p>
                </div>
              )}

              {/* Estado do Certificado */}
              {alunoSelecionado && (
                <div className="space-y-2">
                  <Label className="text-blue-200 font-semibold">Estado do Certificado *</Label>
                  <Select value={estado} onValueChange={(valor) => setEstado(valor as any)}>
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="emitido">Emitido</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="pronto">Pronto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Upload de PDF */}
              {alunoSelecionado && (
                <div className="space-y-2">
                  <Label className="text-blue-200 font-semibold">Carregar PDF do Certificado (Opcional)</Label>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="bg-blue-800/40 border-blue-700 text-white file:bg-blue-700 file:text-white file:border-0 file:rounded"
                  />
                  {pdfFile && <p className="text-xs text-green-400">✓ Arquivo selecionado: {pdfFile.name}</p>}
                </div>
              )}

            </CardContent>
              {/* Botões */}
              <div className="flex justify-end px-6 w-full">
                <div className="flex gap-3 pt-4">
                <Link href="/dashboard/certificados" className="flex-1">
                  <Button variant="outline" className="w-full border-blue-700 text-blue-200 hover:bg-blue-800/50">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  onClick={handleSalvar}
                  disabled={!alunoSelecionado || !notaFinal || salvando}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                >
                  {salvando ? "Salvando..." : "Emitir Certificado"}
                </Button>
              </div>
              </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
