"use client"

import React, { useMemo } from "react"
import { DollarSign, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Pagamento, Matricula, Formacao } from "@/lib/types"

interface SummaryCardsProps {
  pagamentos: Pagamento[]
  matriculas: Matricula[]
  formacoes: Formacao[]
}

export function SummaryCards({
  pagamentos,
  matriculas,
  formacoes,
}: SummaryCardsProps) {
  const stats = useMemo(() => {
    // Cálculos baseados nos pagamentos recebidos como parâmetro (já filtrados)
    // O status já vem recalculado corretamente da página pai
    const pagamentosCompletos = pagamentos.filter((p) => p.status === "completed")
    const pagamentosParciais = pagamentos.filter((p) => p.status === "partial")
    const pagamentosPendentes = pagamentos.filter((p) => p.status === "pending")

    // Total Cobrado = soma de TODAS as parcelas (completas + parciais + pendentes)
    const totalCobrado = pagamentos.reduce((sum, p) => sum + p.amount, 0)
    
    // Total Recebido = apenas pagamentos completos
    const totalRecebido = pagamentosCompletos.reduce((sum, p) => sum + p.amount, 0)
    
    // Total Parcial recebido = valor já pago das parcelas (para pagamentos com status "partial")
    const totalParcialRecebido = pagamentosParciais.reduce(
      (sum, p) => sum + (p.amount * p.installmentsPaid) / p.installments,
      0
    )
    
    // A Receber = pendentes + parte não paga das parciais
    const totalAReceber =
      pagamentosPendentes.reduce((sum, p) => sum + p.amount, 0) +
      pagamentosParciais.reduce(
        (sum, p) => sum + p.amount * (1 - p.installmentsPaid / p.installments),
        0
      )

    return {
      totalCobrado,
      totalRecebido: totalRecebido + totalParcialRecebido,
      totalAReceber,
    }
  }, [pagamentos])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 md:mb-8">
      {/* Total Cobrado */}
      <Card className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Total Faturado</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-orange-400 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">{formatCurrency(stats.totalCobrado)}</div>
          <p className="text-xs text-blue-300 mt-1">Valor total das matrículas</p>
        </CardContent>
      </Card>

      {/* Total Faturado */}
      <Card className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">Total Recebido</CardTitle>
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">{formatCurrency(stats.totalRecebido)}</div>
          <p className="text-xs text-blue-300 mt-1">Pagamentos completos</p>
        </CardContent>
      </Card>

      {/* A Receber */}
      <Card className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-blue-100">A Receber</CardTitle>
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 shrink-0" />
        </CardHeader>
        <CardContent>
          <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-white">{formatCurrency(stats.totalAReceber)}</div>
          <p className="text-xs text-blue-300 mt-1">Pendentes + parciais</p>
        </CardContent>
      </Card>
    </div>
  )
}
