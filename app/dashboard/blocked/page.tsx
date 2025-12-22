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
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl">Subscrição Expirada</CardTitle>
            <CardDescription>Renove sua subscrição para continuar usando a plataforma</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Como renovar:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Escolha seu plano de subscrição</li>
              <li>Aguarde aprovação do Super Admin</li>
              <li>Volte a ter acesso completo</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button className="w-full" asChild>
              <Link href="/dashboard/subscription">Renovar Agora</Link>
            </Button>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="mailto:suporte@formacao-ao.com">Contactar Suporte</Link>
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
