"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import type { Pagamento, PagamentoInstallment, Turma, Aluno } from "@/lib/types"

interface InstallmentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pagamento: Pagamento | null
  installments: PagamentoInstallment[]
  turmas: Turma[]
  alunos: Aluno[]
  loading: boolean
  onPayInstallment: (installmentId: string) => Promise<void>
  onSignNextInstallment: () => Promise<void>
}

export function InstallmentsModal({
  open,
  onOpenChange,
  pagamento,
  installments,
  turmas,
  alunos,
  loading,
  onPayInstallment,
  onSignNextInstallment,
}: InstallmentsModalProps) {
  const getAlunoName = (alunoId: string) => {
    return alunos.find((a) => a.id === alunoId)?.name || "N/A"
  }

  const getTurmaName = (turmaId: string) => {
    return turmas.find((t) => t.id === turmaId)?.name || "N/A"
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  if (!pagamento) return null

  const totalPaid = installments
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0)
  const totalRemaining = installments
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] bg-blue-900 border-blue-800 overflow-hidden flex flex-col p-0">
        <DialogHeader className="border-b border-blue-800 px-4 sm:px-6 py-4">
          <DialogTitle className="text-lg sm:text-2xl text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-orange-400" />
            Prestações do Pagamento
          </DialogTitle>
          <DialogDescription className="text-blue-300 text-xs sm:text-sm">
            Gerencie as prestações de pagamento do aluno
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Header Info - Dados do Aluno */}
          <div className="bg-blue-800/50 px-4 sm:px-6 py-4 border-b border-blue-700 space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                  Aluno
                </p>
                <p className="font-semibold text-white text-sm sm:text-lg">
                  {getAlunoName(pagamento.alunoId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                  Turma
                </p>
                <p className="text-xs sm:text-sm text-blue-300">
                  {getTurmaName(pagamento.turmaId)}
                </p>
              </div>
            </div>

            {/* Resumo de Pagamento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 pt-2 sm:pt-4 border-t border-blue-700">
              <div>
                <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                  Total
                </p>
                <p className="font-bold text-white text-sm sm:text-base">
                  {formatCurrency(pagamento.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                  Pago
                </p>
                <p className="font-bold text-green-400 text-sm sm:text-base">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                  A Pagar
                </p>
                <p className="font-bold text-orange-400 text-sm sm:text-base">
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                  Prestações
                </p>
                <p className="font-bold text-blue-300 text-sm sm:text-base">
                  {installments.filter((i) => i.status === "paid").length}/
                  {installments.length}
                </p>
              </div>
            </div>
          </div>

          {/* Installments List */}
          <div className="flex-1 px-4 sm:px-6 py-4 space-y-2 sm:space-y-3 overflow-y-auto">
            {installments.map((installment) => (
              <div
                key={installment.id}
                className="bg-blue-900/40 border border-blue-700 rounded-lg p-3 sm:p-4 hover:border-blue-600 transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start sm:items-center">
                  {/* Prestação Number */}
                  <div className="sm:col-span-2">
                    <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                      Prestação
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-base sm:text-lg">
                        {installment.installmentNumber}ª
                      </p>
                      <Badge
                        className={
                          installment.status === "paid"
                            ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                            : "bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs"
                        }
                      >
                        {installment.status === "paid"
                          ? "✓ Pago"
                          : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="sm:col-span-2">
                    <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                      Valor
                    </p>
                    <p className="font-bold text-white text-sm sm:text-lg">
                      {formatCurrency(installment.amount)}
                    </p>
                  </div>

                  {/* Data de Pagamento */}
                  <div className="sm:col-span-2">
                    <p className="text-xs text-blue-300 uppercase font-semibold mb-1">
                      Pago em
                    </p>
                    {installment.paidAt ? (
                      <p className="text-xs sm:text-sm text-green-400 font-medium">
                        {installment.paidAt.toLocaleDateString("pt-AO")}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-blue-400">-</p>
                    )}
                  </div>

                  {/* Ação */}
                  <div className="sm:col-span-4 flex gap-1 sm:gap-2 justify-start sm:justify-end">
                    {installment.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => onPayInstallment(installment.id)}
                        disabled={loading}
                        className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm"
                      >
                        {loading ? "..." : "Marcar Pago"}
                      </Button>
                    )}
                    {installment.status === "paid" && (
                      <div className="text-green-400 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start w-full sm:w-auto">
                        ✓ Registrado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          {pagamento.status === "partial" &&
            installments.some((i) => i.status !== "paid") && (
              <div className="border-t border-blue-800 px-4 sm:px-6 py-3 sm:py-4 bg-blue-900/20 flex gap-2">
                <Button
                  onClick={onSignNextInstallment}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                >
                  {loading ? "..." : "✓ Assinar Próxima Prestação"}
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1 border-blue-800 text-blue-200 hover:bg-blue-800 text-xs sm:text-sm"
                >
                  Fechar
                </Button>
              </div>
            )}
          {(pagamento.status !== "partial" ||
            !installments.some((i) => i.status !== "paid")) && (
            <div className="border-t border-blue-800 px-4 sm:px-6 py-3 sm:py-4 bg-blue-900/20">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
