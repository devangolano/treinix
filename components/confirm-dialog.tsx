"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isDangerous?: boolean
  isLoading?: boolean
}

/**
 * Modal de confirmação reutilizável com o mesmo layout do sistema
 * Substitui o confirm() nativo do navegador
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch (error) {
      console.error("Erro ao confirmar:", error)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        onCancel()
      }
    }}>
      <AlertDialogContent className="border-slate-700 bg-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-slate-400">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`${
              isDangerous
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? "Processando..." : confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
