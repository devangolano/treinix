import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export function HeroSection() {
  return (
    <section className="w-full py-8 md:py-10 lg:py-12 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-block rounded-lg bg-blue-900/10 px-3 py-1 text-sm text-blue-900">
              3 Dias de Teste Grátis
            </div>
            <h1 className="text-2xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-balance text-slate-900">
              Sistema Completo de Gestão para Centros de Formação
            </h1>
            <p className="mx-auto max-w-175 text-slate-600 text-lg md:text-xl leading-relaxed">
              Gerencie alunos, turmas, pagamentos e formações em uma única plataforma. Automatize processos e foque no
              que realmente importa: a educação.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="text-base bg-blue-900 text-white hover:bg-blue-950 hover:text-white font-semibold">
              <Link href="/register">
                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base hidden sm:flex text-blue-900 hover:bg-blue-900 hover:text-white font-semibold">
              <Link href="#features">Ver Funcionalidades</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 max-w-2xl w-full">
            <div className="flex items-center gap-1 justify-center sm:justify-start">
              <CheckCircle2 className="h-5 w-5 text-blue-900" />
              <span className="text-sm text-slate-600">3 dias grátis</span>
            </div>
            <div className="flex items-center gap-1 justify-center sm:justify-start">
              <CheckCircle2 className="h-5 w-5 text-blue-900" />
              <span className="text-sm text-slate-600">Sem cartão de crédito</span>
            </div>
            <div className="flex items-center gap-1 justify-center sm:justify-start">
              <CheckCircle2 className="h-5 w-5 text-blue-900" />
              <span className="text-sm text-slate-600">Suporte dedicado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
