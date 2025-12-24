import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full py-4 md:py-8 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              3 Dias de Teste Grátis
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-balance">
              Sistema Completo de Gestão para Centros de Formação
            </h1>
            <p className="mx-auto max-w-175 text-muted-foreground text-lg md:text-xl leading-relaxed">
              Gerencie alunos, turmas, pagamentos e formações em uma única plataforma. Automatize processos e foque no
              que realmente importa: a educação.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="text-base">
              <Link href="/register">
                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base bg-transparent">
              <Link href="#features">Ver Funcionalidades</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-2xl w-full">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">3 dias grátis</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Suporte dedicado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
