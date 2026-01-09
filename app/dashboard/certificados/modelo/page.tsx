"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import {
  getCertificateTemplates,
  createCertificateTemplate,
} from "@/lib/certificate-services"
import { CertificateTemplate } from "@/lib/types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Upload,
  Check,
  FileText,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react"

export default function ConfigurarModeloPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const centroId = user?.centroId

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")

  // Carregar templates
  useEffect(() => {
    if (!centroId || authLoading) return

    async function loadTemplates() {
      try {
        const data = await getCertificateTemplates(centroId!)
        setTemplates(data)
      } catch (error) {
        console.error("Erro ao carregar templates:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTemplates()
  }, [centroId, authLoading])

  // Desativar template anterior quando ativar um novo
  async function handleSetAsActive(templateId: string) {
    if (!centroId) return

    setIsLoading(true)
    try {
      // Desativar todos os outros templates
      const { error: deactivateError } = await supabase
        .from("certificate_templates")
        .update({ is_active: false })
        .eq("centro_id", centroId)

      if (deactivateError) throw deactivateError

      // Ativar o selecionado
      const { error: activateError } = await supabase
        .from("certificate_templates")
        .update({ is_active: true })
        .eq("id", templateId)

      if (activateError) throw activateError

      // Recarregar templates
      const data = await getCertificateTemplates(centroId)
      setTemplates(data)
    } catch (error) {
      console.error("Erro ao ativar template:", error)
      alert("Erro ao ativar template")
    } finally {
      setIsLoading(false)
    }
  }

  // Deletar template
  async function handleDeleteTemplate(templateId: string) {
    if (!centroId) return

    if (!confirm("Tem certeza que deseja deletar este modelo?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("certificate_templates")
        .delete()
        .eq("id", templateId)

      if (error) throw error

      // Recarregar templates
      const data = await getCertificateTemplates(centroId)
      setTemplates(data)
    } catch (error) {
      console.error("Erro ao deletar template:", error)
      alert("Erro ao deletar template")
    } finally {
      setIsLoading(false)
    }
  }

  // Upload novo template
  async function handleUploadTemplate() {
    if (!file || !templateName || !centroId) {
      alert("Por favor, preencha todos os campos")
      return
    }

    setIsLoading(true)
    try {
      // Desativar templates existentes
      await supabase
        .from("certificate_templates")
        .update({ is_active: false })
        .eq("centro_id", centroId)

      // Upload do arquivo
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${centroId}/templates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath)

      // Criar template
      const { error: createError } = await supabase
        .from("certificate_templates")
        .insert({
          centro_id: centroId,
          name: templateName,
          description: templateDescription || null,
          pdf_url: publicUrlData.publicUrl,
          file_path: filePath,
          is_active: true,
        })

      if (createError) throw createError

      // Recarregar templates
      const data = await getCertificateTemplates(centroId)
      setTemplates(data)

      // Limpar formulário
      setFile(null)
      setTemplateName("")
      setTemplateDescription("")
      setIsUploadDialogOpen(false)

      alert("Modelo carregado com sucesso!")
    } catch (error) {
      console.error("Erro ao upload:", error)
      alert("Erro ao upload do modelo")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Spinner />
      </div>
    )
  }

  const activeTemplate = templates.find((t) => t.isActive)

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-4xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
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
                Configurar Modelo de Certificado
              </h1>
              <p className="text-blue-200">
                Cada centro carrega apenas um modelo que será usado em todas as emissões
              </p>
            </div>
          </div>

          {/* Modelo Ativo */}
          {activeTemplate && (
            <Alert className="bg-green-900/30 border-green-800">
              <Check className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300 ml-2">
                Modelo ativo: <strong>{activeTemplate.name}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Card para Upload */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white">Carregar Novo Modelo</CardTitle>
                <CardDescription className="text-blue-300">
                  Faça upload de um arquivo PDF para usar como modelo de certificado.
                  O novo modelo substituirá o anterior automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
                    <Upload className="h-4 w-4" />
                    Carregar Modelo
                  </Button>
                </DialogTrigger>
              </CardContent>
            </Card>

            <DialogContent className="bg-slate-800 border-blue-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Carregar Novo Modelo</DialogTitle>
                <DialogDescription className="text-blue-300">
                  Faça upload do PDF que será usado como modelo de certificado
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <Label htmlFor="template-name" className="text-white">
                    Nome do Modelo
                  </Label>
                  <Input
                    id="template-name"
                    placeholder="Ex: Modelo Padrão 2024"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="bg-blue-900/50 border-blue-700 text-white placeholder-blue-400 mt-2"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <Label htmlFor="template-desc" className="text-white">
                    Descrição (opcional)
                  </Label>
                  <Textarea
                    id="template-desc"
                    placeholder="Descrição do modelo..."
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="bg-blue-900/50 border-blue-700 text-white placeholder-blue-400 mt-2"
                    rows={3}
                  />
                </div>

                {/* Upload */}
                <div>
                  <Label htmlFor="upload-file" className="text-white">
                    Arquivo PDF
                  </Label>
                  <div className="border-2 border-dashed border-blue-800 rounded-lg p-6 text-center mt-2 bg-blue-900/20">
                    <Upload className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                    <input
                      id="upload-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0]
                        if (selectedFile) {
                          setFile(selectedFile)
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="upload-file" className="cursor-pointer block">
                      <p className="text-sm font-medium text-white">
                        Clique para escolher arquivo
                      </p>
                      <p className="text-xs text-blue-300 mt-1">
                        Apenas arquivos PDF são aceitos
                      </p>
                      {file && (
                        <p className="text-xs text-green-300 mt-2">
                          ✓ {file.name}
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => {
                      setIsUploadDialogOpen(false)
                      setFile(null)
                      setTemplateName("")
                      setTemplateDescription("")
                    }}
                    variant="outline"
                    className="border-blue-700 text-blue-300 hover:bg-blue-900/30"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUploadTemplate}
                    disabled={isLoading || !file || !templateName}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Carregar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de Modelos */}
          {templates.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">Modelos Carregados</h2>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`border-2 ${
                    template.isActive
                      ? "bg-green-900/20 border-green-800"
                      : "bg-blue-900/30 border-blue-800"
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {template.name}
                          </h3>
                          {template.isActive && (
                            <span className="flex items-center gap-1 bg-green-900/30 border border-green-800 rounded px-2 py-1 text-xs text-green-300">
                              <Check className="h-3 w-3" />
                              Ativo
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-blue-300 mb-2">
                            {template.description}
                          </p>
                        )}
                        <p className="text-xs text-blue-200">
                          Criado em:{" "}
                          {new Date(template.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {!template.isActive && (
                          <Button
                            onClick={() => handleSetAsActive(template.id)}
                            disabled={isLoading}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm gap-1"
                            size="sm"
                          >
                            <Check className="h-3 w-3" />
                            Ativar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={isLoading || template.isActive}
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert className="bg-amber-900/30 border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300 ml-2">
                Nenhum modelo carregado ainda. Carregue um modelo para começar a emitir certificados.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
