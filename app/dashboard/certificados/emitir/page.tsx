"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, FileText, Loader2, Check, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import {
  getCertificateTemplates,
  issueCertificate,
  getCertificateByAlunoAndTurma,
} from "@/lib/certificate-services"
import { supabase } from "@/lib/supabase"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface CertificateTemplate {
  id: string
  name: string
  description?: string
}

export default function EmitirCertificadoPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [turmas, setTurmas] = useState<Turma[]>([])
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])

  const [selectedTurma, setSelectedTurma] = useState<string>("")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [selectedAlunos, setSelectedAlunos] = useState<Set<string>>(new Set())

  const [alunosComCertificado, setAlunosComCertificado] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [issuingCertificates, setIssuingCertificates] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const centroId = user?.centroId

  useEffect(() => {
    if (!user || !centroId) {
      router.push("/login")
      return
    }

    loadData()
  }, [user, centroId, router])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar turmas
      const { data: turmasData, error: turmasError } = await supabase
        .from("turmas")
        .select("*, formacoes(name)")
        .eq("centro_id", centroId)
        .eq("status", "in_progress")

      if (turmasError) throw turmasError

      const mapped = turmasData.map((turma: any) => ({
        id: turma.id,
        name: turma.name,
        formacao_name: turma.formacoes?.name || "",
        formacao_id: turma.formacao_id,
        centro_id: turma.centro_id,
      }))

      setTurmas(mapped)

      // Carregar templates
      const templates = await getCertificateTemplates(centroId || "")
      setTemplates(
        templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
        }))
      )
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

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

  // Validação
  const isValid =
    selectedTurma &&
    (selectedTemplate || customFile) &&
    selectedAlunos.size > 0

  // Emitir certificados
  async function handleIssueCertificates() {
    if (!isValid || !user || !centroId) return

    setIssuingCertificates(true)
    try {
      let templateId = selectedTemplate

      // Se arquivo customizado, criar um template temporário
      if (customFile && !selectedTemplate) {
        const fileName = `${Date.now()}-${customFile.name}`
        const filePath = `${centroId}/templates/${fileName}`

        // Upload do arquivo
        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(filePath, customFile)

        if (uploadError) throw uploadError

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from("certificates")
          .getPublicUrl(filePath)

        // Criar template
        const { data: templateData, error: templateError } = await supabase
          .from("certificate_templates")
          .insert({
            centro_id: centroId,
            name: `Modelo Customizado - ${new Date().toLocaleDateString()}`,
            pdf_url: publicUrlData.publicUrl,
            file_path: filePath,
            is_active: false,
          })
          .select()
          .single()

        if (templateError) throw templateError
        templateId = templateData.id
      }

      // Emitir certificados para cada aluno selecionado
      const emissionPromises = Array.from(selectedAlunos).map((alunoId) =>
        issueCertificate(
          centroId,
          alunoId,
          selectedTurma,
          templateId,
          user.id
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

  if (!user || loading) {
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/certificados">
                <Button variant="ghost" className="text-blue-300 hover:bg-blue-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Emitir Certificado</h1>
                <p className="text-blue-200">Emita certificados para os alunos de uma turma</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/super-admin/certificados/templates">
                <Button className="bg-blue-900 hover:bg-blue-800 text-white border border-blue-700 gap-2">
                  <Settings className="h-4 w-4" />
                  Modelos
                </Button>
              </Link>
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-900 hover:bg-blue-800 text-white border border-blue-700 gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-blue-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Carregar Modelo Customizado</DialogTitle>
                    <DialogDescription className="text-blue-300">
                      Faça upload de um arquivo PDF que será usado como modelo de certificado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="upload-file" className="text-white">Arquivo PDF</Label>
                      <div className="border-2 border-dashed border-blue-800 rounded-lg p-6 text-center mt-2 bg-blue-900/20">
                        <Upload className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                        <input
                          id="upload-file"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setCustomFile(file)
                              setSelectedTemplate("")
                              setIsUploadModalOpen(false)
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="upload-file"
                          className="cursor-pointer block"
                        >
                          <p className="text-sm font-medium text-white">
                            Clique para escolher arquivo
                          </p>
                          <p className="text-xs text-blue-300 mt-1">
                            Apenas arquivos PDF são aceitos
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

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

              {/* Selecionar Modelo - Apenas aparece após clicar em Upload */}
              {isUploadModalOpen && selectedTurma && (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-white">2. Escolha o Modelo</CardTitle>
                    <CardDescription className="text-blue-300">
                      Use um modelo existente ou faça upload de um customizado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {templates.length > 0 && (
                      <div>
                        <Label className="text-white mb-3 block">Modelos Disponíveis</Label>
                        <Select
                          value={selectedTemplate}
                          onValueChange={setSelectedTemplate}
                          disabled={!!customFile}
                        >
                          <SelectTrigger className="bg-blue-900/50 border-blue-700 text-white">
                            <SelectValue placeholder="Escolha um modelo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="border-t border-blue-700 pt-4">
                      <Label className="text-white mb-3 block">Ou Carregar Modelo Customizado</Label>
                      <div className="border-2 border-dashed border-blue-700 rounded-lg p-8 text-center hover:border-orange-500 transition-colors">
                        <Upload className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setCustomFile(file)
                              setSelectedTemplate("")
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                          disabled={!!selectedTemplate}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer block">
                          <p className="text-sm text-blue-200">
                            Clique para escolher um arquivo PDF
                          </p>
                          <p className="text-xs text-blue-400 mt-1">ou arraste e solte aqui</p>
                        </label>
                        {customFile && (
                          <p className="text-sm font-medium text-green-400 mt-2">
                            ✓ {customFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Selecionar Alunos - Aparece assim que turma é selecionada */}
              {selectedTurma && alunos.length > 0 && (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-white">3. Selecione os Alunos</CardTitle>
                    <CardDescription className="text-blue-300">
                      {selectedAlunos.size} aluno(s) selecionado(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {alunos.map((aluno) => {
                        const temCertificado = alunosComCertificado.has(aluno.id)
                        return (
                          <div
                            key={aluno.id}
                            className="flex items-center gap-3 p-3 border border-blue-700 rounded-lg hover:bg-blue-800/30"
                          >
                            <Checkbox
                              id={aluno.id}
                              checked={selectedAlunos.has(aluno.id)}
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
                            {temCertificado && (
                              <div className="flex items-center gap-1 text-green-400 text-sm">
                                <Check className="h-4 w-4" />
                                <span>Certificado</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resumo */}
            {selectedTurma && (selectedTemplate || customFile) && (
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
                        {selectedTemplate
                          ? templates.find((t) => t.id === selectedTemplate)?.name
                          : customFile
                            ? customFile.name
                            : "—"}
                      </p>
                    </div>

                    <div className="border-t border-blue-700 pt-4">
                      <p className="text-sm text-blue-300">Alunos Selecionados</p>
                      <p className="text-2xl font-bold text-white">{selectedAlunos.size}</p>
                    </div>

                    {selectedAlunos.size > 0 && alunosComCertificado.size > 0 && (
                      <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-3">
                        <p className="text-sm text-amber-300">
                          <strong>{alunosComCertificado.size}</strong> aluno(s) já possuem certificado
                          desta turma
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={handleIssueCertificates}
                      disabled={!isValid || issuingCertificates}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
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
