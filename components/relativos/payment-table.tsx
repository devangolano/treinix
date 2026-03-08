"use client"

import React, { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, AlertCircle, Eye, FileText, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Pagamento, Aluno, Turma, Formacao, Matricula } from "@/lib/types"

interface PaymentTableProps {
  pagamentos: Pagamento[]
  alunos: Aluno[]
  turmas: Turma[]
  formacoes: Formacao[]
  matriculas: Matricula[]
  totalPaginas: number
  paginaAtual: number
  onPaginaChange: (pagina: number) => void
}

type SortField = "aluno" | "valor" | "data" | "status"
type SortOrder = "asc" | "desc"

export function PaymentTable({
  pagamentos,
  alunos,
  turmas,
  formacoes,
  matriculas,
  totalPaginas,
  paginaAtual,
  onPaginaChange,
}: PaymentTableProps) {
  const [sortField, setSortField] = useState<SortField>("data")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const ITENS_POR_PAGINA = 15

  const getNomeAluno = (alunoId: string) => {
    return alunos.find((a) => a.id === alunoId)?.name || "N/A"
  }

  const getNomeFormacao = (formacaoId: string | undefined) => {
    return formacoes.find((f) => f.id === formacaoId)?.name || "N/A"
  }

  const getNomeTurma = (turmaId: string) => {
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

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "partial":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Pago"
      case "partial":
        return "Parcial"
      case "pending":
        return "Pendente"
      case "cancelled":
        return "Cancelado"
      default:
        return "Desconhecido"
    }
  }

  const pagamentosPaginados = useMemo(() => {
    const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA

    let sorted = [...pagamentos]

    // Ordenação
    sorted.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case "aluno":
          aValue = getNomeAluno(a.alunoId).toLowerCase()
          bValue = getNomeAluno(b.alunoId).toLowerCase()
          break
        case "valor":
          aValue = a.amount
          bValue = b.amount
          break
        case "data":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = 0
          bValue = 0
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return sorted.slice(indiceInicial, indiceFinal)
  }, [pagamentos, paginaAtual, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const SortableHeader = ({
    field,
    label,
  }: {
    field: SortField
    label: string
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-2 hover:text-blue-200 transition-colors"
    >
      {label}
      {sortField === field && (
        <ArrowUpDown className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
      )}
    </button>
  )

  return (
    <Card className="bg-blue-900/30 border-blue-800/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Detalhamento de Pagamentos</CardTitle>
          <CardDescription className="text-blue-300">
            {pagamentos.length} pagamento(s) encontrado(s)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {pagamentos.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <p className="text-blue-300 font-medium">Nenhum pagamento encontrado</p>
            <p className="text-blue-400 text-sm mt-1">
              Tente ajustar os filtros para encontrar pagamentos
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-800/50 bg-blue-800/20">
                    <th className="text-left py-4 px-4 font-semibold text-blue-300">
                      <SortableHeader field="aluno" label="Aluno" />
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-blue-300">
                      Formação
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-blue-300">
                      Turma
                    </th>
                    <th className="text-right py-4 px-4 font-semibold text-blue-300">
                      <SortableHeader field="valor" label="Valor" />
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-blue-300">
                      Parcelas
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-blue-300">
                      Método
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-blue-300">
                      <SortableHeader field="data" label="Data" />
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-blue-300">
                      <SortableHeader field="status" label="Status" />
                    </th>
                    <th className="text-center py-4 px-4 font-semibold text-blue-300">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosPaginados.map((pag, idx) => (
                    <tr
                      key={pag.id}
                      className={`border-b border-blue-800/30 transition-colors ${
                        idx % 2 === 0 ? "bg-blue-900/10" : "bg-transparent"
                      } hover:bg-blue-900/20`}
                    >
                      <td className="py-4 px-4 text-blue-100 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          {getNomeAluno(pag.alunoId)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-blue-300">
                        {getNomeFormacao(
                          matriculas.find((m) => m.id === pag.matriculaId)?.formacaoId
                        )}
                      </td>
                      <td className="py-4 px-4 text-blue-300">{getNomeTurma(pag.turmaId)}</td>
                      <td className="py-4 px-4 text-blue-100 font-semibold text-right">
                        {formatCurrency(pag.amount)}
                      </td>
                      <td className="py-4 px-4 text-blue-300 text-center">
                        <span className="px-2 py-1 rounded-full bg-blue-800/30 border border-blue-700/50 text-xs font-medium">
                          {pag.installmentsPaid}/{pag.installments}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-blue-300">
                        <span className="capitalize">{pag.paymentMethod || "N/A"}</span>
                      </td>
                      <td className="py-4 px-4 text-blue-300 text-center">
                        {formatDate(pag.createdAt)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className={getPaymentStatusColor(pag.status)}>
                          {getPaymentStatusLabel(pag.status)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-lg bg-blue-800/30 text-blue-400 hover:bg-blue-700/30 transition-colors" title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-lg bg-blue-800/30 text-blue-400 hover:bg-blue-700/30 transition-colors" title="Recibo">
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-blue-800/50">
              <div className="text-sm text-blue-300">
                Mostrando{" "}
                <span className="font-semibold">
                  {(paginaAtual - 1) * ITENS_POR_PAGINA + 1}
                </span>{" "}
                a{" "}
                <span className="font-semibold">
                  {Math.min(paginaAtual * ITENS_POR_PAGINA, pagamentos.length)}
                </span>{" "}
                de <span className="font-semibold">{pagamentos.length}</span> pagamento(s)
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onPaginaChange(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-blue-800/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                    .slice(Math.max(0, paginaAtual - 2), Math.min(totalPaginas, paginaAtual + 1))
                    .map((pagina) => (
                      <Button
                        key={pagina}
                        onClick={() => onPaginaChange(pagina)}
                        variant={paginaAtual === pagina ? "default" : "outline"}
                        size="sm"
                        className={
                          paginaAtual === pagina
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-blue-800/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/50"
                        }
                      >
                        {pagina}
                      </Button>
                    ))}
                </div>

                <Button
                  onClick={() => onPaginaChange(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-blue-800/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
