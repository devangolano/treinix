import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NProgress from 'nprogress'

// Configurar NProgress
NProgress.configure({
  minimum: 0.3,
  easing: 'ease',
  speed: 200,
  showSpinner: false,
})

export function useNProgress() {
  const router = useRouter()

  useEffect(() => {
    // Listener para quando a rota começa a mudar
    const handleStart = () => {
      NProgress.start()
    }

    const handleStop = () => {
      NProgress.done()
    }

    // Interceptar navegação usando router events
    const originalPush = router.push
    const originalReplace = router.replace

    router.push = async (...args) => {
      handleStart()
      try {
        const result = await originalPush(...args)
        return result
      } finally {
        handleStop()
      }
    }

    router.replace = async (...args) => {
      handleStart()
      try {
        const result = await originalReplace(...args)
        return result
      } finally {
        handleStop()
      }
    }

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router])

  return {
    start: () => NProgress.start(),
    done: () => NProgress.done(),
    inc: () => NProgress.inc(),
    set: (n: number) => NProgress.set(n),
  }
}

export default NProgress
