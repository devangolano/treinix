/**
 * Utilitários de navegação robustos para Vercel
 * 
 * Combina router.replace() com fallback window.location
 * para garantir navegação em todos os ambientes
 */

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export interface NavigationOptions {
  /**
   * Tempo de espera antes do fallback com window.location (ms)
   * @default 1500
   */
  fallbackDelay?: number
  /**
   * Callback executado após tentativa de navegação
   */
  onNavigate?: () => void
}

/**
 * Redireciona para uma URL de forma robusta
 * 
 * 1. Tenta usar router.replace() (Next.js recomendado)
 * 2. Se falhar, usa window.location.href como fallback
 * 
 * @param router - Instância de router do Next.js
 * @param url - URL de destino
 * @param options - Opções de navegação
 * 
 * @example
 * ```tsx
 * const router = useRouter()
 * await safeNavigate(router, '/dashboard', { fallbackDelay: 1500 })
 * ```
 */
export async function safeNavigate(
  router: AppRouterInstance,
  url: string,
  options: NavigationOptions = {}
): Promise<void> {
  const { fallbackDelay = 1500, onNavigate } = options

  console.log(`[safeNavigate] Iniciando navegação para ${url}`)

  try {
    // Tentar usando router.replace() primeiro
    router.replace(url)
    
    // Se chegou aqui, pode chamar o callback
    onNavigate?.()

    // Aguardar fallback
    if (fallbackDelay > 0) {
      await new Promise((resolve) => {
        setTimeout(() => {
          console.log(`[safeNavigate] Fallback timeout de ${fallbackDelay}ms atingido`)
          resolve(null)
        }, fallbackDelay)
      })

      // Verificar se ainda está na mesma página (navegação falhou)
      if (typeof window !== "undefined" && !window.location.pathname.includes(url)) {
        console.log(`[safeNavigate] Fallback - usando window.location.href para ${url}`)
        window.location.href = url
      }
    }
  } catch (error) {
    console.error(`[safeNavigate] Erro ao navegar`, error)
    
    // Fallback imediato em caso de erro
    if (typeof window !== "undefined") {
      console.log(`[safeNavigate] Erro - fallback imediato para ${url}`)
      window.location.href = url
    }
  }
}

/**
 * Versão assíncrona de safeNavigate que espera a conclusão
 * Útil para situações onde você quer garantir que a navegação aconteceu
 */
export async function safeNavigateAsync(
  router: AppRouterInstance,
  url: string,
  options: NavigationOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    const { fallbackDelay = 1500 } = options

    console.log(`[safeNavigateAsync] Iniciando navegação assíncrona para ${url}`)

    // Iniciar navegação
    router.replace(url)

    // Aguardar verificação
    const checkInterval = setInterval(() => {
      if (typeof window !== "undefined") {
        if (window.location.pathname === url || window.location.pathname.startsWith(url)) {
          console.log(`[safeNavigateAsync] Navegação confirmada para ${url}`)
          clearInterval(checkInterval)
          resolve(true)
        }
      }
    }, 100)

    // Timeout com fallback
    setTimeout(() => {
      clearInterval(checkInterval)
      
      if (typeof window !== "undefined") {
        if (!window.location.pathname.includes(url)) {
          console.log(`[safeNavigateAsync] Timeout - usando fallback para ${url}`)
          window.location.href = url
        }
      }
      
      resolve(false)
    }, fallbackDelay)
  })
}
