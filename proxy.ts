import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/", "/login", "/register"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith("/api/public"))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar autenticação (simulado via headers para o mock)
  const authToken = request.cookies.get("auth-token")?.value

  if (!authToken) {
    // Redirecionar para login se não autenticado
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Nota: A lógica de verificação de role (super_admin vs centro_admin) 
  // é feita no lado do cliente nos layouts e guards
  // Isso permite transições suaves e melhor UX

  // Rotas do super admin - apenas verificar autenticação aqui
  if (pathname.startsWith("/super-admin")) {
    return NextResponse.next()
  }

  // Rotas dos centros - apenas verificar autenticação aqui
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
