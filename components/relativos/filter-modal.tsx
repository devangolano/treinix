"use client"

import React from "react"
import {
  Filter,
  BookOpen,
  Users,
  CheckCircle2,
  RotateCcw,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Formacao, Turma } from "@/lib/types"

interface FilterModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formacoes: Formacao[]
  turmas: Turma[]
  filtros: {
    dataInicio: string
    dataFim: string
    formacao: string
    turma: string
    status: string
  }
  onFiltroChange: (key: string, value: string) => void
  onReset: () => void
}

export function FilterModal({
  isOpen,
  onOpenChange,
  formacoes,
  turmas,
  filtros,
  onFiltroChange,
  onReset,
}: FilterModalProps) {
  const totalFiltrosAtivos = [
    filtros.dataInicio,
    filtros.dataFim,
    filtros.formacao,
    filtros.turma,
    filtros.status,
  ].filter((f) => f && f.trim() !== "").length

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto bg-blue-900 border-blue-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-400" />
            Filtros Avançados
            {totalFiltrosAtivos > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-orange-500 text-xs font-bold text-white">
                {totalFiltrosAtivos}
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-blue-200">
            Personalize seus filtros para encontrar os resultados que procura
          </DialogDescription>
        </DialogHeader>

        {/* Seção de Período */}
        <div className="py-2 sm:py-6 border-b border-blue-800">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Calendar className="h-4 w-4 text-orange-400" />
            <label className="text-xs sm:text-sm font-semibold text-blue-100">Período</label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs text-blue-300 font-medium mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => onFiltroChange("dataInicio", e.target.value)}
                className="w-full px-2 sm:px-3 py-2 bg-blue-800/30 border border-blue-800 text-white rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-blue-300 font-medium mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => onFiltroChange("dataFim", e.target.value)}
                className="w-full px-2 sm:px-3 py-2 bg-blue-800/30 border border-blue-800 text-white rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Grid de Filtros Responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 py-4 sm:py-6">
          {/* Filtro Formação */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-100">
              <BookOpen className="h-4 w-4 text-orange-400" />
              Formação
            </label>
            <Select value={filtros.formacao} onValueChange={(value) => onFiltroChange("formacao", value === "all" ? "" : value)}>
              <SelectTrigger className="bg-blue-800/30 border-blue-800 text-blue-100 hover:border-orange-500/50 text-xs sm:text-sm">
                <SelectValue placeholder="Selecione uma formação" />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-800">
                <SelectItem value="all">Todas as formações</SelectItem>
                {formacoes.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Turma */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-100">
              <Users className="h-4 w-4 text-orange-400" />
              Turma
            </label>
            <Select value={filtros.turma} onValueChange={(value) => onFiltroChange("turma", value === "all" ? "" : value)}>
              <SelectTrigger className="bg-blue-800/30 border-blue-800 text-blue-100 hover:border-orange-500/50 text-xs sm:text-sm">
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-800">
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Status */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-100">
              <CheckCircle2 className="h-4 w-4 text-orange-400" />
              Status
            </label>
            <Select value={filtros.status} onValueChange={(value) => onFiltroChange("status", value === "all" ? "" : value)}>
              <SelectTrigger className="bg-blue-800/30 border-blue-800 text-blue-100 hover:border-orange-500/50 text-xs sm:text-sm">
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent className="bg-blue-900 border-blue-800">
                <SelectItem value="all">Todos os pagamentos</SelectItem>
                <SelectItem value="completed">Recebido</SelectItem>
                <SelectItem value="pending_partial">A Receber</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-blue-800">
          <Button
            onClick={onReset}
            variant="outline"
            disabled={totalFiltrosAtivos === 0}
            className="w-full sm:flex-1 gap-2 border-blue-800 text-blue-200 hover:bg-blue-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:flex-1 gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm"
          >
            Aplicar Filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
