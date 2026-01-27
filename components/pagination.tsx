"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
}

export function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage = 10 }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    const halfVisible = Math.floor(maxVisible / 2)

    if (totalPages <= maxVisible) {
      // Se o total de páginas é menor que o máximo visível, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Mostrar primeira página
      pages.push(1)

      // Calcular intervalo de páginas ao redor da página atual
      let startPage = Math.max(2, currentPage - halfVisible)
      let endPage = Math.min(totalPages - 1, currentPage + halfVisible)

      // Ajustar se estiver perto do final
      if (endPage - startPage < maxVisible - 2) {
        if (startPage === 2) {
          endPage = Math.min(totalPages - 1, endPage + (maxVisible - 2 - (endPage - startPage)))
        } else {
          startPage = Math.max(2, startPage - (maxVisible - 2 - (endPage - startPage)))
        }
      }

      // Adicionar reticências se necessário
      if (startPage > 2) {
        pages.push("...")
      }

      // Adicionar páginas do intervalo
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Adicionar reticências se necessário
      if (endPage < totalPages - 1) {
        pages.push("...")
      }

      // Mostrar última página
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="text-sm text-blue-300">
        Página <span className="font-semibold text-white">{currentPage}</span> de{" "}
        <span className="font-semibold text-white">{totalPages}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="border-blue-700 text-blue-200 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Primeira página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-blue-700 text-blue-200 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={typeof page !== "number"}
              className={
                page === currentPage
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                  : "border-blue-700 text-blue-200 hover:bg-blue-800 disabled:cursor-default"
              }
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-blue-700 text-blue-200 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="border-blue-700 text-blue-200 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
