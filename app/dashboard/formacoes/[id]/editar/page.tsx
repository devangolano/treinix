"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { signIn, signOut, getCurrentUser, onAuthStateChange } from "@/lib/supabase-auth"
import { formacaoService  } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"

export default function EditarFormacaoPage() {
  const router = useRouter()
  const params = useParams()
  const formacaoId = params.id as string
  const { user: currentUser } = useAuth()
  const [formacao, setFormacao] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    price: "",
    category: "",
    status: "active" as "active" | "inactive",
  })

  useEffect(() => {
    if (!currentUser || !currentUser.centroId) {
      router.push("/login")
      return
    }
    loadFormacao(currentUser.centroId)
  }, [currentUser, router, formacaoId])

  const loadFormacao = async (centroId: string) => {
    try {
      setLoading(true)
      const formacoes = await formacaoService.getAll(centroId)
      const found = formacoes.find((f) => f.id === formacaoId)
      if (found) {
        setFormacao(found)
        setFormData({
          name: found.name,
          description: found.description,
          duration: found.duration.toString(),
          price: found.price.toString(),
          category: found.category,
          status: found.status,
        })
      } else {
        toast({ title: "Formação não encontrada", variant: "destructive" })
        router.push("/dashboard/formacoes")
      }
    } catch (error) {
      console.error("Erro ao carregar formação:", error)
      toast({ title: "Erro ao carregar formação", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.centroId) return

    setSubmitting(true)
    try {
      await formacaoService.update(formacaoId, {
        name: formData.name,
        description: formData.description,
        duration: Number(formData.duration),
        price: Number(formData.price),
        category: formData.category,
        status: formData.status,
      })
      toast({ title: "Formação atualizada com sucesso!" })
      router.push("/dashboard/formacoes")
    } catch (error) {
      toast({ title: "Erro ao atualizar formação", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentUser || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-3xl py-6 md:py-8 px-4 md:px-6">
          <Link href="/dashboard/formacoes">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Editar Formação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Formação</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (horas)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (Kz)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Link href="/dashboard/formacoes" className="flex-1">
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
    </div>
  )
}
