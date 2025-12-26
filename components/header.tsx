import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="Treinix Logo" width={180} height={45} className="h-10 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Funcionalidades
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Preços
          </Link>
          <Link
            href="#contact"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Contacto
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="hidden md:inline-flex bg-white text-slate-900 hover:bg-white/90 font-medium">
            <Link href="/register">Começar Grátis</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
