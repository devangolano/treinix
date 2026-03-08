'use client'

import { useEffect } from 'react'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

export function NProgressProvider() {
  useEffect(() => {
    // Configurar NProgress uma única vez
    NProgress.configure({
      minimum: 0.3,
      easing: 'ease',
      speed: 200,
      showSpinner: false,
    })

    // Completar o progresso inicial quando a página carrega
    NProgress.done()

    return () => {
      // Limpar ao desmontar
      NProgress.remove()
    }
  }, [])

  return null
}
