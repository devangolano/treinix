import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="w-full border-t border-primary/20 bg-slate-900">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-7 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Treinix Logo" width={140} height={35} className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              Sistema completo de gestão para centros de formação em Angola.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Produto</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
                  Preços
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Teste Grátis
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Sobre
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-sm text-white/70 hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Suporte
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
