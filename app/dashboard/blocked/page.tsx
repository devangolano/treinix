"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { signIn, signOut, getCurrentUser, onAuthStateChange } from "@/lib/supabase-auth"
import { useRouter } from "next/navigation"

export default function BlockedPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-blue-900/30 border-blue-800">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-2xl text-white">Subscrição Expirada</CardTitle>
            <CardDescription className="text-blue-300">Renove sua subscrição para continuar usando a plataforma</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-800/40 border border-blue-700 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm text-blue-200">Como renovar:</h3>
            <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
              <li>Escolha seu plano de subscrição</li>
              <li>Aguarde aprovação do Suporte</li>
              <li>Volte a ter acesso completo</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold" asChild>
              <Link href="/dashboard/subscription">Renovar Agora</Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-blue-700 text-blue-200 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500"
              onClick={() => {
                const whatsappNumber = "244948324028" // Angola +244
                const message = "Olá, pretendo renovar a minha subscrição na plataforma Formação-AO"
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, "_blank")
              }}
            >
              Contactar via WhatsApp
            </Button>
            <Button variant="ghost" className="w-full text-blue-300 hover:text-orange-400 hover:bg-blue-900/30" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
