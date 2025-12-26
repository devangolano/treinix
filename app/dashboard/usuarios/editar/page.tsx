"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CentroSidebar } from "@/components/centro-sidebar"
import { userService } from "@/lib/supabase-services"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"

export default function EditarUsuarioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "secretario" as "centro_admin" | "secretario",
  })

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }
    if (currentUser.role !== "centro_admin") {
      router.push("/dashboard")
      return
    }

    // Obter o ID do usuário dos parâmetros
    const id = searchParams.get("id")
    if (!id) {
      toast({ title: "Erro", description: "ID do usuário não fornecido", variant: "destructive" })
      router.push("/dashboard/usuarios")
      return
    }

    setUsuarioId(id)
    loadUsuario(id)
  }, [currentUser, router, searchParams, toast])

  const loadUsuario = async (id: string) => {
    try {
      setLoading(true)
      const usuario = await userService.getById(id)
      
      if (!usuario) {
        toast({ title: "Erro", description: "Usuário não encontrado", variant: "destructive" })
        router.push("/dashboard/usuarios")
        return
      }

      setFormData({
        name: usuario.name,
        email: usuario.email,
        phone: usuario.phone || "",
        role: usuario.role,
      })
    } catch (error) {
      console.error("Erro ao carregar usuário:", error)
      toast({ title: "Erro ao carregar usuário", variant: "destructive" })
      router.push("/dashboard/usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuarioId) return

    if (!formData.phone.trim()) {
      toast({ title: "Telefone é obrigatório", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const result = await userService.update(usuarioId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      })

      if (!result) {
        toast({ title: "Erro ao atualizar usuário", variant: "destructive" })
        return
      }

      toast({ title: "Usuário atualizado com sucesso!" })
      router.push("/dashboard/usuarios")
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({ title: "Erro ao atualizar usuário", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (!currentUser || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-2xl py-6 md:py-8 px-4 md:px-6">
          <Link href="/dashboard/usuarios">
            <Button variant="ghost" size="sm" className="mb-4 text-blue-300 hover:text-orange-400 hover:bg-blue-900/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Editar Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-blue-200 font-semibold">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: João da Silva Santos"
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-200 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@seucentro.com"
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    disabled
                  />
                  <p className="text-xs text-blue-300">Email não pode ser alterado</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-blue-200 font-semibold">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: +244 912 345 678 ou 912345678"
                    className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-blue-200 font-semibold">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "centro_admin" | "secretario") => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="centro_admin">Administrador</SelectItem>
                      <SelectItem value="secretario">Secretário/a</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-blue-300">
                    {formData.role === "centro_admin"
                      ? "Acesso total ao sistema, incluindo criação de usuários"
                      : "Acesso limitado: pode gerenciar alunos, turmas e pagamentos"}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Link href="/dashboard/usuarios" className="flex-1">
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
