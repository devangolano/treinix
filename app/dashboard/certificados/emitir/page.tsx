"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { getCertificateTemplateForCenter, issueCertificate } from "@/lib/certificate-services"
import { getUserDatabaseId } from "@/lib/supabase-auth"
import { CertificateTemplate } from "@/lib/types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react"

interface Turma {
  id: string
  name: string
  formacao_name: string
  formacao_id: string
  centro_id: string
}

interface Aluno {
  id: string
  name: string
  email: string
  status: string
}

export default function EmitirCertificadoPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const centroId = user?.centroId

  // Estados
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [selectedTurma, setSelectedTurma] = useState("")
  const [selectedAlunos, setSelectedAlunos] = useState<Set<string>>(new Set())
  const [alunosComCertificado, setAlunosComCertificado] = useState<Set<string>>(
    new Set()
  )
  const [finalGrades, setFinalGrades] = useState<Map<string, number>>(new Map())
  const [template, setTemplate] = useState<CertificateTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [issuingCertificates, setIssuingCertificates] = useState(false)
  const [templateError, setTemplateError] = useState(false)

  // Carregar turmas e template do centro
  useEffect(() => {
    if (!centroId || authLoading) return

    async function loadInitialData() {
      try {
        // Carregar turmas
        const { data: turmasData, error: turmasError } = await supabase
          .from("turmas")
          .select("id, name, formacao_id, centro_id, formacoes(name)")
          .eq("centro_id", centroId)

        if (turmasError) throw turmasError

        const mapped = turmasData.map((turma: any) => ({
          id: turma.id,
          name: turma.name,
          formacao_name: turma.formacoes?.name || "",
          formacao_id: turma.formacao_id,
          centro_id: turma.centro_id,
        }))

        setTurmas(mapped)

        // Carregar o modelo ativo do centro
        const templateData = await getCertificateTemplateForCenter(centroId || "")
        if (templateData) {
          setTemplate(templateData)
          setTemplateError(false)
        } else {
          setTemplate(null)
          setTemplateError(true)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setTemplateError(true)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [centroId, authLoading])

  // Carregar alunos da turma selecionada
  useEffect(() => {
    if (!selectedTurma) {
      setAlunos([])
      setAlunosComCertificado(new Set())
      return
    }

    async function loadAlunosDaTurma() {
      try {
        // Buscar alunos da turma (sem filtro de status, pega todos os matriculados)
        const { data: alunosData, error: alunosError } = await supabase
          .from("alunos")
          .select("id, name, email, status")
          .eq("turma_id", selectedTurma)

        if (alunosError) {
          console.error("Erro ao buscar alunos:", alunosError)
          throw alunosError
        }

        console.log("Alunos carregados:", alunosData)
        setAlunos(alunosData || [])

        // Verificar quais já possuem certificado
        const { data: certsData, error: certsError } = await supabase
          .from("certificates")
          .select("aluno_id")
          .eq("turma_id", selectedTurma)
          .eq("status", "issued")

        if (certsError) throw certsError

        const comCertificado = new Set(certsData?.map((c) => c.aluno_id) || [])
        setAlunosComCertificado(comCertificado)
        setSelectedAlunos(new Set())
      } catch (error) {
        console.error("Erro ao carregar alunos:", error)
      }
    }

    loadAlunosDaTurma()
  }, [selectedTurma])

  // Toggle seleção de aluno
  function toggleAluno(alunoId: string) {
    const newSelected = new Set(selectedAlunos)
    if (newSelected.has(alunoId)) {
      newSelected.delete(alunoId)
    } else {
      newSelected.add(alunoId)
    }
    setSelectedAlunos(newSelected)
  }

  // Atualizar nota final do aluno
  function updateFinalGrade(alunoId: string, grade: number | null) {
    const newGrades = new Map(finalGrades)
    if (grade === null || grade === undefined || isNaN(grade)) {
      newGrades.delete(alunoId)
    } else {
      newGrades.set(alunoId, grade)
    }
    setFinalGrades(newGrades)
  }

  // Validação
  const isValid = selectedTurma && selectedAlunos.size > 0 && template

  // Verificar se todos os alunos selecionados têm nota
  const allStudentsHaveGrades = Array.from(selectedAlunos).every(
    (alunoId) => finalGrades.has(alunoId) && finalGrades.get(alunoId) !== null
  )

  // Emitir certificados
  async function handleIssueCertificates() {
    if (!isValid || !user || !centroId || !template) return

    // Validar se todos os alunos têm nota
    if (!allStudentsHaveGrades) {
      alert("Todos os alunos selecionados devem ter uma nota final antes de emitir certificados.")
      return
    }

    setIssuingCertificates(true)
    try {
      // Obter o ID do usuário na tabela users (necessário para issued_by)
      const userDatabaseId = await getUserDatabaseId(user.id)
      
      if (!userDatabaseId) {
        alert("Erro: Usuário não encontrado no banco de dados. Verifique sua autenticação.")
        setIssuingCertificates(false)
        return
      }

      // Emitir certificados para cada aluno selecionado
      const emissionPromises = Array.from(selectedAlunos).map((alunoId) =>
        issueCertificate(
          centroId,
          alunoId,
          selectedTurma,
          template.id,
          userDatabaseId,
          {
            finalGrade: finalGrades.get(alunoId),
          }
        )
      )

      await Promise.all(emissionPromises)

      // Sucesso
      alert(`${selectedAlunos.size} certificado(s) emitido(s) com sucesso!`)
      router.push("/dashboard/certificados")
    } catch (error) {
      console.error("Erro ao emitir certificados:", error)
      alert("Erro ao emitir certificados")
    } finally {
      setIssuingCertificates(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/certificados">
              <Button
                variant="ghost"
                className="text-blue-300 hover:bg-blue-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Emitir Certificado
              </h1>
              <p className="text-blue-200">
                Emita certificados para os alunos de uma turma
              </p>
            </div>
          </div>

          {/* Alerta se não houver modelo */}
          {templateError && (
            <Alert className="bg-red-900/30 border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300 ml-2">
                Nenhum modelo de certificado carregado. Por favor,{" "}
                <Link
                  href="/dashboard/certificados/modelo"
                  className="underline font-semibold hover:text-red-200"
                >
                  carregue um modelo
                </Link>{" "}
                antes de emitir certificados.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Formulário */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selecionar Turma */}
              <Card className="bg-blue-900/30 border-blue-800">
                <CardHeader>
                  <CardTitle className="text-white">1. Selecione a Turma</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                    <SelectTrigger className="bg-blue-900/50 border-blue-700 text-white">
                      <SelectValue placeholder="Escolha uma turma..." />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.name} - {turma.formacao_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Informação do Modelo */}
              {template && (
                <Card className="bg-green-900/30 border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-300 flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Modelo de Certificado Carregado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white font-semibold">{template.name}</p>
                    {template.description && (
                      <p className="text-green-200 text-sm mt-1">
                        {template.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Selecionar Alunos - Aparece assim que turma é selecionada */}
              {selectedTurma && alunos.length > 0 && (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-white">2. Selecione os Alunos</CardTitle>
                    <CardDescription className="text-blue-300">
                      {selectedAlunos.size} aluno(s) selecionado(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {alunos.map((aluno) => {
                        const temCertificado = alunosComCertificado.has(aluno.id)
                        const isSelected = selectedAlunos.has(aluno.id)
                        const finalGrade = finalGrades.get(aluno.id)
                        return (
                          <div
                            key={aluno.id}
                            className="flex items-center justify-between gap-3 p-3 border border-blue-700 rounded-lg hover:bg-blue-800/30"
                          >
                            {/* Lado esquerdo: Checkbox + Dados do aluno */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Checkbox
                                id={aluno.id}
                                checked={isSelected}
                                onCheckedChange={() => toggleAluno(aluno.id)}
                                disabled={temCertificado}
                              />
                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={aluno.id}
                                  className="text-sm font-medium text-white cursor-pointer"
                                >
                                  {aluno.name}
                                </label>
                                <p className="text-xs text-blue-300">{aluno.email}</p>
                              </div>
                            </div>

                            {/* Lado direito: Nota Final ou Status */}
                            <div className="flex items-center gap-2 ml-2">
                              {isSelected && !temCertificado && (
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-blue-300 whitespace-nowrap">
                                    Nota:
                                  </label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.01"
                                    placeholder="ex: 17.5"
                                    value={finalGrade || ""}
                                    onChange={(e) =>
                                      updateFinalGrade(
                                        aluno.id,
                                        e.target.value ? parseFloat(e.target.value) : null
                                      )
                                    }
                                    className="w-22 bg-blue-900/50 border-blue-600 text-white placeholder:text-blue-400 text-sm text-center"
                                  />
                                </div>
                              )}
                              
                              {temCertificado && (
                                <div className="flex items-center gap-1 text-green-400 text-sm whitespace-nowrap">
                                  <Check className="h-4 w-4" />
                                  <span>Certificado</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resumo */}
            {selectedTurma && (
              <div>
                <Card className="sticky top-6 bg-blue-900/30 border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-white">Resumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-blue-300">Turma</p>
                      <p className="font-semibold text-white">
                        {turmas.find((t) => t.id === selectedTurma)?.name || "—"}
                      </p>
                    </div>

                    <div className="border-t border-blue-700 pt-4">
                      <p className="text-sm text-blue-300">Modelo</p>
                      <p className="font-semibold text-white text-sm">
                        {template?.name || "—"}
                      </p>
                    </div>

                    <div className="border-t border-blue-700 pt-4">
                      <p className="text-sm text-blue-300">Alunos Selecionados</p>
                      <p className="text-2xl font-bold text-white">
                        {selectedAlunos.size}
                      </p>
                    </div>

                    {selectedAlunos.size > 0 && alunosComCertificado.size > 0 && (
                      <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                        <p className="text-sm text-amber-300">
                          <strong>{alunosComCertificado.size}</strong> aluno(s) já
                          possuem certificado desta turma
                        </p>
                      </div>
                    )}

                    {selectedAlunos.size > 0 && !allStudentsHaveGrades && (
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                        <p className="text-sm text-red-300">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          Todos os alunos selecionados precisam de uma nota final
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleIssueCertificates}
                      disabled={!isValid || issuingCertificates || !allStudentsHaveGrades}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {issuingCertificates ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Emitindo...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Emitir Certificados
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
