"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { centroService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Upload, Save, Loader2, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import type { Centro } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import Image from "next/image"
import { supabase } from "@/lib/supabase"

export default function CentroPerfilPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [centro, setCentro] = useState<Centro | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    nif: "",
  })

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadCentro(currentUser.centroId)
  }, [currentUser, router])

  const loadCentro = async (centroId: string) => {
    try {
      const data = await centroService.getById(centroId)
      if (data) {
        setCentro(data)
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          nif: data.nif || "",
        })
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl)
          setLogoPreview(data.logoUrl)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar centro:", error)
      toast.error("Erro ao carregar dados do centro")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem válida")
        return
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem não pode ser maior que 5MB")
        return
      }

      setLogoFile(file)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !centro) return logoUrl

    try {
      setUploading(true)

      // Deletar logo anterior se existir
      if (logoUrl) {
        try {
          const oldPath = logoUrl.split("/").pop()
          if (oldPath) {
            await supabase.storage.from("centro-logos").remove([`${centro.id}/${oldPath}`])
          }
        } catch (err) {
          console.error("Erro ao deletar logo anterior:", err)
        }
      }

      // Upload do novo arquivo
      const filename = `${Date.now()}-${logoFile.name}`
      const filepath = `${centro.id}/${filename}`
      
      console.log("Iniciando upload:", { filepath, fileSize: logoFile.size, fileType: logoFile.type })

      const { data, error } = await supabase.storage
        .from("centro-logos")
        .upload(filepath, logoFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (error) {
        console.error("Erro detalhado do upload:", error)
        throw new Error(`Erro ao fazer upload: ${error.message}`)
      }

      console.log("Upload bem-sucedido:", data)

      // Gerar URL pública
      const { data: publicData } = supabase.storage
        .from("centro-logos")
        .getPublicUrl(filepath)

      console.log("URL pública gerada:", publicData.publicUrl)
      return publicData.publicUrl
    } catch (error) {
      console.error("Erro ao fazer upload da logo:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao fazer upload"
      toast.error(`❌ ${errorMessage}. Verifique as políticas RLS do bucket.`)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!centro) return

    try {
      setSaving(true)

      // Se houver novo arquivo de logo, fazer upload
      let newLogoUrl = logoUrl
      if (logoFile) {
        newLogoUrl = await uploadLogo()
        if (!newLogoUrl) {
          toast.error("Falha ao salvar logo")
          return
        }
      }

      // Atualizar centro
      const updated = await centroService.update(centro.id, {
        ...formData,
        logoUrl: newLogoUrl || undefined,
      })

      if (updated) {
        setCentro(updated)
        setLogoUrl(newLogoUrl)
        setLogoFile(null)
        toast.success("Dados do centro atualizados com sucesso!")
      } else {
        toast.error("Erro ao atualizar dados do centro")
      }
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar dados")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-2xl px-4 md:px-6 py-6 md:py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-blue-300 hover:text-orange-400 hover:bg-blue-900/30 mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-white">Perfil do Centro</h1>
              <p className="text-blue-300 mt-2">Gerencie os dados e a logo do seu centro</p>
            </div>
          </div>

          {/* Card de Perfil */}
          <Card className="bg-blue-900/20 border-blue-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Dados do Centro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-4">
                <Label className="text-white">Logo do Centro</Label>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Preview */}
                  <div className="shrink-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-blue-900/40 border-2 border-dashed border-blue-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex justify-center flex-col items-center text-blue-400">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <span className="text-xs text-center">Sem logo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload */}
                  <div className="flex-1 flex flex-col justify-center">
                    <Label htmlFor="logo-input" className="cursor-pointer">
                      <div className="border-2 border-dashed border-blue-600 rounded-lg p-6 text-center hover:border-orange-400 hover:bg-blue-900/10 transition-colors">
                        <Upload className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                        <p className="text-sm font-semibold text-white mb-1">Clique para selecionar</p>
                        <p className="text-xs text-blue-300">PNG, JPG, GIF até 5MB</p>
                      </div>
                      <input
                        id="logo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </Label>
                    {logoFile && (
                      <p className="text-sm text-green-400 mt-2">
                        ✓ {logoFile.name} selecionado
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-blue-700/50" />

              {/* Formulário */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Nome do Centro
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nome do centro"
                    className="mt-2 bg-blue-900/30 border-blue-700 text-white placeholder-blue-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@centro.com"
                      className="mt-2 bg-blue-900/30 border-blue-700 text-white placeholder-blue-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-white">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+244 923 123 456"
                      className="mt-2 bg-blue-900/30 border-blue-700 text-white placeholder-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address" className="text-white">
                    Endereço
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Rua, número, cidade"
                    className="mt-2 bg-blue-900/30 border-blue-700 text-white placeholder-blue-400"
                  />
                </div>

                <div>
                  <Label htmlFor="nif" className="text-white">
                    NIF (opcional)
                  </Label>
                  <Input
                    id="nif"
                    name="nif"
                    value={formData.nif}
                    onChange={handleInputChange}
                    placeholder="Número de Identificação Fiscal"
                    className="mt-2 bg-blue-900/30 border-blue-700 text-white placeholder-blue-400"
                  />
                </div>
              </div>

              <Separator className="bg-blue-700/50" />

              {/* Botão Salvar */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (centro) {
                      setFormData({
                        name: centro.name,
                        email: centro.email,
                        phone: centro.phone,
                        address: centro.address,
                        nif: centro.nif || "",
                      })
                      setLogoFile(null)
                      if (centro.logoUrl) {
                        setLogoPreview(centro.logoUrl)
                      }
                    }
                  }}
                  className="border-blue-600 text-blue-300 hover:bg-blue-900/30"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving || uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
