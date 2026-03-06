"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { certificadoService, alunoService, formacaoService, turmaService } from "@/lib/supabase-services"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  Download,
  MessageCircle,
  File,
  Trash2,
} from "lucide-react"
import type { Certificado, Aluno, Formacao, Turma } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import { Pagination } from "@/components/pagination"

export default function CertificadosPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [formacoes, setFormacoes] = useState<Formacao[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [formacaoFilter, setFormacaoFilter] = useState<string>("all")
  const [turmaFilter, setTurmaFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (authLoading) return

    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    loadData(user.centroId)
  }, [user, authLoading, router])

  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      setError(null)

      const [certificadosData, alunosData, formacoesData, turmasData] = await Promise.all([
        certificadoService.getAll(centroId),
        alunoService.getAll(centroId),
        formacaoService.getAll(centroId),
        turmaService.getAll(centroId),
      ])

      setCertificados(certificadosData)
      setAlunos(alunosData)
      setFormacoes(formacoesData)
      setTurmas(turmasData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar dados"
      setError(message)
      console.error("Erro ao carregar dados:", err)
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCertificado = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este certificado?")) return

    try {
      const success = await certificadoService.delete(id)
      if (success) {
        setCertificados(certificados.filter((c) => c.id !== id))
        alert("Certificado deletado com sucesso")
      } else {
        alert("Erro ao deletar certificado")
      }
    } catch (err) {
      console.error("Erro ao deletar certificado:", err)
      alert("Erro ao deletar certificado")
    }
  }

  const handleUpdateEstado = async (certificadoId: string, novoEstado: "emitido" | "em_andamento" | "pronto") => {
    try {
      const certificado = certificados.find((c) => c.id === certificadoId)
      if (!certificado) return

      const success = await certificadoService.update(certificadoId, {
        ...certificado,
        estado: novoEstado,
      })

      if (success) {
        setCertificados(
          certificados.map((c) =>
            c.id === certificadoId ? { ...c, estado: novoEstado } : c
          )
        )
        alert("Estado do certificado atualizado com sucesso")
      }
    } catch (err) {
      console.error("Erro ao atualizar estado:", err)
      alert("Erro ao atualizar estado do certificado")
    }
  }

  const handleEnviarWhatsApp = (certificadoId: string) => {
    const certificado = certificados.find((c) => c.id === certificadoId)
    if (!certificado) return

    const aluno = alunos.find((a) => a.id === certificado.alunoId)
    if (!aluno || !aluno.phone) {
      alert("Número de telefone do aluno não encontrado")
      return
    }

    const mensagem = `Olá ${aluno.name}! 🎓\n\nO seu certificado já está pronto para levantar! 🎉\n\nPor favor, dirija-se à nossa instituição para recolher seu certificado.\n\nFicamos felizes em poder reconhecer seu esforço e dedicação.\n\nAtenciosamente,\nCentro de Formação`

    const urlWhatsApp = `https://wa.me/${aluno.phone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`
    window.open(urlWhatsApp, "_blank")
  }

  const handleDownloadPDF = async (pdfUrl: string, nomeAluno: string) => {
    try {
      const response = await fetch(pdfUrl, {
        mode: "cors",
        cache: "no-cache",
      })

      if (!response.ok) {
        throw new Error(`Erro: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `certificado-${nomeAluno}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao fazer download:", error)
      alert("Erro ao fazer download do PDF. Tente novamente.")
    }
  }

  const getNomeAluno = (alunoId: string) => {
    return alunos.find((a) => a.id === alunoId)?.name || "N/A"
  }

  const getNomeFormacao = (formacaoId: string) => {
    return formacoes.find((f) => f.id === formacaoId)?.name || "N/A"
  }

  const getNomeTurma = (turmaId: string) => {
    return turmas.find((t) => t.id === turmaId)?.name || "N/A"
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getEstadoBadge = (estado: string) => {
    const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string }> = {
      emitido: { variant: "secondary", label: "Emitido", color: "bg-blue-500" },
      em_andamento: { variant: "outline", label: "Em Andamento", color: "bg-yellow-500" },
      pronto: { variant: "default", label: "Pronto", color: "bg-green-500" },
    }
    const config = configs[estado] || configs.emitido
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Filtrar certificados
  const filteredCertificados = certificados.filter((cert) => {
    const matchesSearch = getNomeAluno(cert.alunoId).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFormacao = formacaoFilter === "all" || cert.formacaoId === formacaoFilter
    const matchesTurma = turmaFilter === "all" || cert.turmaId === turmaFilter

    return matchesSearch && matchesFormacao && matchesTurma
  })

  // Paginação
  const totalPages = Math.ceil(filteredCertificados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCertificados = filteredCertificados.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, formacaoFilter, turmaFilter])

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <CentroSidebar />
        <div className="flex-1 flex items-center justify-center bg-slate-900">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
        <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Certificados</h1>
              <p className="text-blue-200">Gerencie os certificados emitidos</p>
            </div>

            <Link href="/dashboard/certificados/novo">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Certificado
              </Button>
            </Link>
          </div>

          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Busca e Filtros */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <Input
                    placeholder="Buscar por nome do aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-blue-800/40 border-blue-700 text-white placeholder:text-blue-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-2 md:flex gap-2 md:gap-3">
                  <Select value={formacaoFilter} onValueChange={setFormacaoFilter}>
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white text-xs md:text-sm">
                      <SelectValue placeholder="Formação" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="all">Todas</SelectItem>
                      {formacoes.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={turmaFilter} onValueChange={setTurmaFilter}>
                    <SelectTrigger className="bg-blue-800/40 border-blue-700 text-white text-xs md:text-sm">
                      <SelectValue placeholder="Turma" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-800">
                      <SelectItem value="all">Todas</SelectItem>
                      {turmas.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Informação de resultados */}
              <div className="text-xs md:text-sm text-blue-300">
                {filteredCertificados.length === certificados.length ? (
                  <span>{certificados.length} certificado(s)</span>
                ) : (
                  <span>
                    {filteredCertificados.length} de {certificados.length}
                  </span>
                )}
              </div>
            </div>
          </CardContent>

          {/* Exibição Desktop - Tabela */}
          <div className="hidden md:block rounded-lg border border-blue-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-blue-800/50">
                <TableRow className="hover:bg-blue-800/50 border-blue-700">
                  <TableHead className="text-blue-100 font-semibold">Aluno</TableHead>
                  <TableHead className="text-blue-100 font-semibold">Formação</TableHead>
                  <TableHead className="text-blue-100 font-semibold">Nota</TableHead>
                  <TableHead className="text-blue-100 font-semibold">Estado</TableHead>
                  <TableHead className="text-blue-100 font-semibold">Data Emissão</TableHead>
                  <TableHead className="text-blue-100 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificados.length === 0 ? (
                  <TableRow className="border-blue-700 hover:bg-blue-900/20">
                    <TableCell colSpan={6} className="text-center text-blue-300 py-8">
                      {certificados.length === 0
                        ? "Nenhum certificado emitido"
                        : "Nenhum certificado encontrado com os filtros aplicados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCertificados.map((cert) => (
                    <TableRow key={cert.id} className="border-blue-700 hover:bg-blue-900/30 transition-colors">
                      <TableCell className="text-white font-medium">{getNomeAluno(cert.alunoId)}</TableCell>
                      <TableCell className="text-blue-200">{getNomeFormacao(cert.formacaoId)}</TableCell>
                      <TableCell className="text-blue-200 font-semibold">{cert.notaFinal.toFixed(1)}</TableCell>
                      <TableCell>
                        <Select value={cert.estado || "emitido"} onValueChange={(valor) => handleUpdateEstado(cert.id, valor as any)}>
                          <SelectTrigger className="w-fit bg-blue-800/40 border-blue-700 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-blue-900 border-blue-800">
                            <SelectItem value="emitido">Emitido</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="pronto">Pronto</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-blue-200 text-sm">{formatDate(cert.dataEmissao)}</TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          {cert.estado === "pronto" && (
                            <Button
                              size="sm"
                              onClick={() => handleEnviarWhatsApp(cert.id)}
                              className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                              title="Enviar mensagem WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {cert.pdfUrl && (
                            <Button
                              size="sm"
                              onClick={() => window.open(cert.pdfUrl, "_blank")}
                              className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-2"
                              title="Ver PDF"
                            >
                              <File className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {cert.pdfUrl && (
                            <Button
                              size="sm"
                              onClick={() => handleDownloadPDF(cert.pdfUrl!, getNomeAluno(cert.alunoId))}
                              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-2"
                              title="Baixar PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleDeleteCertificado(cert.id)}
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-2"
                            title="Deletar certificado"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação Desktop */}
          {filteredCertificados.length > 0 && (
            <div className="hidden md:block mt-4 border-t border-blue-700 pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}

          {/* Exibição Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {filteredCertificados.length === 0 ? (
              <div className="text-center text-blue-300 py-8">
                {certificados.length === 0
                  ? "Nenhum certificado emitido"
                  : "Nenhum certificado encontrado com os filtros aplicados"}
              </div>
            ) : (
              paginatedCertificados.map((cert) => (
                <Card key={cert.id} className="bg-blue-800/40 border-blue-700 hover:border-orange-500 transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{getNomeAluno(cert.alunoId)}</p>
                          <p className="text-sm text-blue-200 truncate">{getNomeFormacao(cert.formacaoId)}</p>
                        </div>
                        <Badge
                          variant={cert.status === "active" ? "default" : "secondary"}
                          className="bg-orange-500 text-white border-orange-600 shrink-0"
                        >
                          {cert.status === "active" ? "Ativo" : "Cancelado"}
                        </Badge>
                      </div>

                      <div className="flex gap-4 text-sm text-blue-300 border-t border-blue-700 pt-2">
                        <div>
                          <p className="text-xs text-blue-400">Turma</p>
                          <p className="text-blue-200">{getNomeTurma(cert.turmaId)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-400">Nota Final</p>
                          <p className="text-blue-200 font-semibold">{cert.notaFinal.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 border-t border-blue-700 pt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (cert.pdfUrl) {
                              window.open(cert.pdfUrl, "_blank")
                            } else {
                              alert("PDF não disponível")
                            }
                          }}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs"
                          disabled={!cert.pdfUrl}
                        >
                          <File className="h-4 w-4 mr-1" />
                          Ver PDF
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => {
                            try {
                              if (cert.pdfUrl) {
                                handleDownloadPDF(cert.pdfUrl, getNomeAluno(cert.alunoId))
                              } else {
                                alert("PDF não disponível para download")
                              }
                            } catch (error) {
                              console.error("Erro ao fazer download:", error)
                              alert("Erro ao fazer download do PDF")
                            }
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs"
                          disabled={!cert.pdfUrl}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleDeleteCertificado(cert.id)}
                          className="bg-red-600 hover:bg-red-700 text-white h-9 px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Paginação Mobile */}
          {filteredCertificados.length > 0 && (
            <div className="md:hidden mt-4 border-t border-blue-700 pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
