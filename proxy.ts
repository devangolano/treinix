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

  // Rotas do super admin
  if (pathname.startsWith("/super-admin")) {
    // Verificar se é super admin (em produção, verificar o token)
    return NextResponse.next()
  }

  // Rotas dos centros - verificar subscrição
  if (pathname.startsWith("/dashboard")) {
    // Em produção, extrair centroId do token
    // Para o mock, permitir acesso (a verificação será feita no lado do cliente)
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
