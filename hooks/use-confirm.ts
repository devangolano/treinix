"use client"

import { useState } from "react"

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

/**
 * Hook para gerenciar diálogos de confirmação
 * Substitui window.confirm() nativo
 * 
 * @example
 * const { openConfirm, ConfirmDialogComponent } = useConfirm()
 * 
 * const handleDelete = async () => {
 *   const confirmed = await openConfirm({
 *     title: "Deletar?",
 *     description: "Esta ação não pode ser desfeita",
 *     isDangerous: true
 *   })
 *   
 *   if (confirmed) {
 *     // executar ação de deletar
 *   }
 * }
 */
export function useConfirm() {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" })
  const [resolveCallback, setResolveCallback] = useState<((confirmed: boolean) => void) | null>(null)

  const openConfirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setOpen(true)
      setResolveCallback(() => resolve)
    })
  }

  const handleConfirm = () => {
    setOpen(false)
    resolveCallback?.(true)
    setResolveCallback(null)
  }

  const handleCancel = () => {
    setOpen(false)
    resolveCallback?.(false)
    setResolveCallback(null)
  }

  return {
    openConfirm,
    open,
    options,
    handleConfirm,
    handleCancel,
  }
}
