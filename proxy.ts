import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/", "/login", "/register", "/api"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Para rotas protegidas, deixar o cliente (componentes) fazer a verificação
  // O middleware NÃO deve redirecionar pois:
  // 1. Precisa aguardar o hydration do React no cliente
  // 2. O AuthProvider precisa carregar os dados de sessão do Supabase
  // 3. Evita race conditions entre middleware e client-side guards
  //
  // Os guards no cliente (DashboardGuard, SubscriptionGuard) cuidam de:
  // - Verificar se há sessão ativa
  // - Redirecionar para /login se não autenticado
  // - Verificar role (super_admin vs centro_admin)
  // - Verificar subscrição ativa
  
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
