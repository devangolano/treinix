"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Upload, Loader2, FileText, Edit2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"
import Link from "next/link"

interface CertificateTemplate {
  id: string
  centro_id: string
  name: string
  description?: string
  pdf_url: string
  file_path: string
  is_active: boolean
  centro_name: string
  created_at: string
}

export default function CertificateTemplatesPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [centros, setCentros] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)

  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    centroId: "",
    name: "",
    description: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar templates e centros
  useEffect(() => {
    // Se ainda está carregando autenticação, não faz nada
    if (isLoading) {
      return
    }

    // Se não está autenticado, redireciona
    if (!user) {
      router.push("/login")
      return
    }

    // Se não é super_admin, redireciona para dashboard
    if (user.role !== "super_admin") {
      router.push("/dashboard")
      return
    }

    async function loadData() {
      try {
        // Carregar centros
        const { data: centrosData, error: centrosError } = await supabase
          .from("centros")
          .select("id, name")
          .order("name")

        if (centrosError) throw centrosError
        setCentros(centrosData || [])

        // Carregar templates
        const { data: templatesData, error: templatesError } = await supabase
          .from("certificate_templates")
          .select("*, centros(name) as centro_data")
          .order("created_at", { ascending: false })

        if (templatesError) throw templatesError

        const mapped = templatesData.map((t: any) => ({
          ...t,
          centro_name: t.centro_data?.[0]?.name || "Desconhecido",
        }))

        setTemplates(mapped)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isLoading, user, router])

  // Submeter formulário
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !formData.centroId || !formData.name) {
      alert("Por favor preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${formData.centroId}/templates/${fileName}`

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from("certificates")
        .getPublicUrl(filePath)

      // Criar template no banco
      const { data, error } = await supabase
        .from("certificate_templates")
        .insert({
          centro_id: formData.centroId,
          name: formData.name,
          description: formData.description,
          pdf_url: publicUrlData.publicUrl,
          file_path: filePath,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Atualizar lista
      const centro = centros.find((c) => c.id === formData.centroId)
      setTemplates([
        { ...data, centro_name: centro?.name || "Desconhecido" },
        ...templates,
      ])

      // Limpar formulário
      setFormData({ centroId: "", name: "", description: "" })
      setFile(null)
      setIsOpen(false)
      alert("Modelo criado com sucesso!")
    } catch (error) {
      console.error("Erro ao criar template:", error)
      alert("Erro ao criar modelo")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deletar template
  async function handleDelete(templateId: string, filePath: string) {
    if (!confirm("Tem certeza que deseja deletar este modelo?")) return

    try {
      // Deletar arquivo do storage
      await supabase.storage.from("certificates").remove([filePath])

      // Deletar do banco
      const { error } = await supabase
        .from("certificate_templates")
        .delete()
        .eq("id", templateId)

      if (error) throw error

      setTemplates(templates.filter((t) => t.id !== templateId))
      alert("Modelo deletado com sucesso!")
    } catch (error) {
      console.error("Erro ao deletar template:", error)
      alert("Erro ao deletar modelo")
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/super-admin/certificados">
                <Button variant="ghost" size="icon" className="text-blue-200 hover:bg-blue-900/30">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Modelos de Certificados</h1>
                <p className="text-blue-200">Gerencie os modelos de certificados dos centros</p>
              </div>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Modelo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-blue-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Novo Modelo de Certificado</DialogTitle>
                  <DialogDescription className="text-blue-300">
                    Faça upload de um arquivo PDF que será usado como modelo de certificado
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Centro */}
                  <div>
                    <Label htmlFor="centro" className="text-white">Centro de Formação *</Label>
                    <select
                      id="centro"
                      value={formData.centroId}
                      onChange={(e) =>
                        setFormData({ ...formData, centroId: e.target.value })
                      }
                      className="w-full mt-2 px-3 py-2 bg-slate-700 border border-blue-800 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" className="bg-slate-700">Selecione um centro...</option>
                      {centros.map((centro) => (
                        <option key={centro.id} value={centro.id} className="bg-slate-700">
                          {centro.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nome */}
                  <div>
                    <Label htmlFor="name" className="text-white">Nome do Modelo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Modelo Oficial 2024"
                      className="mt-2 bg-slate-700 border-blue-800 text-white placeholder:text-blue-400"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description" className="text-white">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descrição opcional do modelo..."
                      className="mt-2 bg-slate-700 border-blue-800 text-white placeholder:text-blue-400"
                      rows={3}
                    />
                  </div>

                  {/* Upload de Arquivo */}
                  <div>
                    <Label htmlFor="file" className="text-white">Arquivo PDF *</Label>
                    <div className="border-2 border-dashed border-blue-800 rounded-lg p-6 text-center mt-2 bg-blue-900/20">
                      <Upload className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                      <input
                        id="file"
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
                      <label
                        htmlFor="file"
                        className="cursor-pointer block"
                      >
                        <p className="text-sm font-medium text-white">
                          Clique para escolher arquivo
                        </p>
                        <p className="text-xs text-blue-300 mt-1">
                          Apenas arquivos PDF são aceitos
                        </p>
                      </label>
                      {file && (
                        <p className="text-sm font-medium text-green-400 mt-2">
                          ✓ {file.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Modelo"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-800 text-blue-200 hover:bg-blue-900/30"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabela */}
          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader className="border-b border-blue-800">
              <CardTitle className="text-white">Modelos Disponíveis</CardTitle>
              <CardDescription className="text-blue-300">
                {templates.length} modelo{templates.length !== 1 ? "s" : ""} criado{templates.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300">Nenhum modelo de certificado criado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-700 hover:bg-blue-800/50">
                        <TableHead className="text-blue-200">Nome</TableHead>
                        <TableHead className="text-blue-200">Centro</TableHead>
                        <TableHead className="text-blue-200">Descrição</TableHead>
                        <TableHead className="text-blue-200">Status</TableHead>
                        <TableHead className="text-blue-200">Data Criação</TableHead>
                        <TableHead className="text-right text-blue-200">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map((template) => (
                        <TableRow key={template.id} className="border-blue-700 hover:bg-blue-800/30">
                          <TableCell className="font-medium text-white">
                            {template.name}
                          </TableCell>
                          <TableCell className="text-blue-100">{template.centro_name}</TableCell>
                          <TableCell className="text-sm text-blue-300 max-w-md truncate">
                            {template.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                template.is_active ? "default" : "secondary"
                              }
                              className={template.is_active ? "bg-green-600/80 text-white" : "bg-slate-600 text-blue-200"}
                            >
                              {template.is_active
                                ? "Ativo"
                                : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-blue-100">
                            {new Date(
                              template.created_at
                            ).toLocaleDateString("pt-AO")}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <a
                              href={template.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 text-sm font-medium inline-block"
                            >
                              Ver
                            </a>
                            <button
                              onClick={() =>
                                handleDelete(
                                  template.id,
                                  template.file_path
                                )
                              }
                              className="text-red-400 hover:text-red-300 text-sm font-medium inline-block"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
