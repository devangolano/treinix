"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

/**
 * LoginPage - SIMPLIFICADO
 * 
 * NÃO faz redirecionamento automático
 * Redirecionamento é feito via proxy.ts (server-side)
 * ou após login bem-sucedido com window.location
 */
export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[LoginPage] Tentando login com:", email)
      const result = await login(email, password)

      if (result.success && result.user) {
        console.log("[LoginPage] Login bem-sucedido!", result.user.role)
        
        // Usar hard redirect via window.location
        // Isso força o navegador a refazer a requisição, 
        // e proxy.ts vai deixar passar porque token agora é válido
        const redirectUrl = result.user.role === "super_admin" ? "/super-admin" : "/dashboard"
        
        console.log("[LoginPage] Redirecionando para:", redirectUrl)
        // IMPORTANTE: Usar window.location para hard redirect
        // Isso força navegador a refazer requisição com novo token
        window.location.href = redirectUrl
      } else {
        setError("Email ou senha incorretos.")
        setLoading(false)
      }
    } catch (err) {
      console.error("[LoginPage] Erro:", err)
      setError("Erro ao fazer login. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950 p-4">
      <Card className="w-full max-w-md bg-blue-900/40 border-blue-800 shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Treinix Logo"
                width={140}
                height={35}
                className="h-8 w-auto"
              />
            </Link>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl text-white">Entrar na Plataforma</CardTitle>
            <CardDescription className="text-blue-100">Acesse sua conta para continuar</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-semibold">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-blue-200">Ainda não tem uma conta? </span>
              <Link
                href="/register"
                className="text-orange-400 hover:text-orange-300 hover:underline font-semibold"
              >
                Criar conta grátis
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
