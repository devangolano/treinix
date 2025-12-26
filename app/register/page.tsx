"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { signUp } from "@/lib/supabase-auth"
import { centroService, userService } from "@/lib/supabase-services"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    centroName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      // Criar usuário no Supabase Auth
      const authResult = await signUp(formData.email, formData.password, formData.centroName)

      if (!authResult.success) {
        // Se o erro for "user_already_exists", mostrar mensagem mais clara
        if (authResult.error?.includes("already registered") || authResult.error?.includes("already exists")) {
          setError("Este email já foi registrado. Por favor, faça login ou use outro email.")
        } else {
          setError(authResult.error || "Erro ao criar conta")
        }
        setLoading(false)
        return
      }

      const authUserId = authResult.data?.id

      // Pequeno delay para garantir que o usuário foi criado
      await new Promise(resolve => setTimeout(resolve, 500))

      // Criar centro no banco de dados
      const centroResult = await centroService.create({
        name: formData.centroName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        nif: "",
      })

      if (!centroResult) {
        setError("Erro ao criar centro de formação. Verifique se o schema foi executado.")
        setLoading(false)
        return
      }

      // Criar registro na tabela users para o admin do centro
      if (authUserId && centroResult.id) {
        try {
          await userService.create({
            centroId: centroResult.id,
            name: formData.centroName,
            email: formData.email,
            phone: formData.phone,
            role: "centro_admin",
            authUserId: authUserId,
          })
        } catch (userError) {
          console.error("Erro ao criar registro do usuário na tabela users:", userError)
          // Continuar mesmo se falhar, pois o getUserProfile consegue buscar pelo email
        }
      }

      // Guardar centroId no localStorage
      if (authUserId) {
        localStorage.setItem(`centro_${authUserId}`, centroResult.id)
      }

      // Fazer login automaticamente após registro bem-sucedido
      const loginSuccess = await login(formData.email, formData.password)
      
      if (loginSuccess) {
        // Aguardar um pouco para o AuthProvider atualizar
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push("/dashboard")
      } else {
        // Se login falhar, redirecionar para login page
        router.push("/login")
      }
      
      setLoading(false)
    } catch (err) {
      console.error("Erro ao criar conta:", err)
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente."
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950 p-4">
      <Card className="w-full max-w-2xl bg-blue-900/40 border-blue-800 shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Treinix Logo" width={140} height={35} className="h-8 w-auto" />
            </Link>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl text-white">Criar Conta</CardTitle>
            <CardDescription className="text-blue-100">Comece seu teste grátis de 3 dias agora</CardDescription>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-blue-200">3 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-blue-200">Sem cartão</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-blue-200">Suporte dedicado</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="centroName" className="text-white font-semibold">Nome do Centro de Formação</Label>
                <Input
                  id="centroName"
                  name="centroName"
                  placeholder="Ex: Centro de Formação Excellence"
                  value={formData.centroName}
                  onChange={handleChange}
                  className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contato@centro.ao"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white font-semibold">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+244 923 456 789"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-white font-semibold">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Ex: Luanda, Talatona"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-semibold">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-semibold">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repita a senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta e Começar Teste Grátis"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-blue-200">Já tem uma conta? </span>
              <Link href="/login" className="text-orange-400 hover:text-orange-300 hover:underline font-semibold">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
