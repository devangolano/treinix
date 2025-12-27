"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasRedirected = useRef(false)

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!isLoading && user && !hasRedirected.current) {
      hasRedirected.current = true
      console.log("LoginPage: Usuário já autenticado, redirecionando...", user.role)
      if (user.role === "super_admin") {
        router.replace("/super-admin")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setIsRedirecting(false)

    try {
      console.log("LoginPage: Tentando fazer login com", email)
      const result = await login(email, password)
      
      console.log("LoginPage: Login retornou resultado:", result.success, result.user?.role)

      if (result.success && result.user) {
        console.log("LoginPage: Login bem-sucedido, redirecionando para", result.user.role === "super_admin" ? "/super-admin" : "/dashboard")
        setIsRedirecting(true)
        
        // Redirecionar baseado na role
        const redirectUrl = result.user.role === "super_admin" ? "/super-admin" : "/dashboard"
        
        // Usar replace em vez de push para evitar voltar para login
        // Pequeno delay para garantir que o estado foi atualizado antes de redirecionar
        console.log("LoginPage: Aguardando 100ms antes de redirecionar para", redirectUrl)
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log("LoginPage: Fazendo router.replace para", redirectUrl)
        router.replace(redirectUrl)
      } else {
        console.log("LoginPage: Falha no login", result)
        setError("Email ou senha incorretos.")
        setLoading(false)
        setIsRedirecting(false)
      }
    } catch (err) {
      console.error("LoginPage: Erro ao fazer login", err)
      setError("Erro ao fazer login. Tente novamente.")
      setLoading(false)
      setIsRedirecting(false)
    }
  }

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-center">
          <div className="inline-block">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-orange-500"></div>
          </div>
          <p className="mt-4 text-white">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950 p-4">
      <Card className="w-full max-w-md bg-blue-900/40 border-blue-800 shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Treinix Logo" width={140} height={35} className="h-8 w-auto" />
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
              <Label htmlFor="email" className="text-white font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-semibold">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-200 focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" disabled={loading || isRedirecting}>
              {loading ? "Entrando..." : isRedirecting ? "Redirecionando..." : "Entrar"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-blue-200">Ainda não tem uma conta? </span>
              <Link href="/register" className="text-orange-400 hover:text-orange-300 hover:underline font-semibold">
                Criar conta grátis
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
