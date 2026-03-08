'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'

export function RouteProgressHandler() {
  const pathname = usePathname()
  const previousPathname = useRef<string>(pathname)

  useEffect(() => {
    // Configurar NProgress
    NProgress.configure({
      minimum: 0.3,
      easing: 'ease',
      speed: 200,
      showSpinner: false,
    })
  }, [])

  useEffect(() => {
    // Se o pathname mudou, é porque houve navegação
    if (previousPathname.current !== pathname) {
      NProgress.start()
      
      // Terminar o progress após o carregamento
      const timeout = setTimeout(() => {
        NProgress.done()
      }, 800)

      previousPathname.current = pathname

      return () => clearTimeout(timeout)
    }
  }, [pathname])

  return null
}
