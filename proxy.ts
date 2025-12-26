import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Define headers de cache control baseado na rota
 */
function setCacheHeaders(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas que NÃO devem ser cacheadas
  const noCacheRoutes = [
    "/login",
    "/register",
    "/dashboard",
    "/super-admin",
    "/api/auth",
  ]

  const shouldNotCache = noCacheRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  )

  if (shouldNotCache) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
    return response
  }

  return NextResponse.next()
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/", "/login", "/register"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith("/api/public"))

  if (isPublicRoute) {
    return setCacheHeaders(request)
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
    return setCacheHeaders(request)
  }

  // Rotas dos centros - apenas verificar autenticação aqui
  if (pathname.startsWith("/dashboard")) {
    return setCacheHeaders(request)
  }

  return setCacheHeaders(request)
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
