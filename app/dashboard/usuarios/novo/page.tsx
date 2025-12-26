"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CentroSidebar } from "@/components/centro-sidebar"
import { userService } from "@/lib/supabase-services"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function NovoUsuarioPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [userCreated, setUserCreated] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
  }, [currentUser, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.centroId) return

    if (!formData.phone.trim()) {
      toast({ title: "Telefone é obrigatório", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const result = await userService.create({
        centroId: currentUser.centroId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password || undefined,
      })

      if (!result) {
        toast({ title: "Erro ao criar usuário", variant: "destructive" })
        return
      }

      setUserCreated(result)
      toast({ 
        title: "Usuário criado com sucesso!",
        description: result.generatedPassword 
          ? "Uma senha foi gerada automaticamente. Compartilhe-a com o usuário."
          : "O usuário pode fazer login com a senha fornecida."
      })
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      toast({ 
        title: "Erro ao criar usuário", 
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!currentUser) return null

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

          {userCreated ? (
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white text-2xl">✅ Usuário Criado com Sucesso!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-green-900/30 border-green-800">
                  <AlertTitle className="text-green-300">Dados de Acesso</AlertTitle>
                  <AlertDescription className="text-green-200 mt-2 space-y-3">
                    <div>
                      <p className="text-xs text-green-300 mb-1">Email:</p>
                      <div className="flex items-center gap-2 bg-blue-950/50 p-2 rounded">
                        <code className="text-sm flex-1">{userCreated.email}</code>
                        <button
                          onClick={() => copyToClipboard(userCreated.email)}
                          className="text-green-300 hover:text-green-100"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {userCreated.generatedPassword && (
                      <div>
                        <p className="text-xs text-green-300 mb-1">Senha Temporária (gerada automaticamente):</p>
                        <div className="flex items-center gap-2 bg-blue-950/50 p-2 rounded">
                          <code className="text-sm flex-1 font-mono">{userCreated.generatedPassword}</code>
                          <button
                            onClick={() => copyToClipboard(userCreated.generatedPassword)}
                            className="text-green-300 hover:text-green-100"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-amber-300 mt-2">⚠️ Salve estas credenciais e compartilhe de forma segura com o usuário</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="font-semibold text-white">Informações do Usuário:</h3>
                  <div className="bg-blue-800/20 rounded p-4 space-y-2">
                    <p className="text-sm"><span className="text-blue-300">Nome:</span> <span className="text-white">{userCreated.name}</span></p>
                    <p className="text-sm"><span className="text-blue-300">Email:</span> <span className="text-white">{userCreated.email}</span></p>
                    <p className="text-sm"><span className="text-blue-300">Telefone:</span> <span className="text-white">{userCreated.phone}</span></p>
                    <p className="text-sm"><span className="text-blue-300">Função:</span> <span className="text-white capitalize">{userCreated.role === "centro_admin" ? "Administrador" : "Secretário/a"}</span></p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Link href="/dashboard/usuarios" className="flex-1">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      Voltar para Usuários
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => {
                      setUserCreated(null)
                      setFormData({ name: "", email: "", password: "", phone: "", role: "secretario" })
                    }}
                    variant="outline"
                    className="flex-1 border-blue-700 text-blue-200 hover:bg-blue-900/30 hover:border-orange-500"
                  >
                    Criar Outro Usuário
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-blue-900/30 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Criar Novo Usuário</CardTitle>
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
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-200 font-semibold">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Será gerada automaticamente se deixado em branco"
                      className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                      minLength={6}
                    />
                    <p className="text-xs text-blue-300">
                      Deixe em branco para gerar uma senha aleatória de forma automática
                    </p>
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
                    <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      {loading ? "Criando..." : "Criar Usuário"}
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
          )}
        </div>
      </div>
    </div>
  )
}
