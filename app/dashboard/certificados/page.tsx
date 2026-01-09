"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, FileText, Loader2, Award, Download, Filter } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Spinner } from "@/components/ui/spinner"

interface CertificateWithDetails {
  id: string
  aluno_name: string
  turma_name: string
  formacao_name: string
  certificate_number: string
  issue_date: string
  final_grade: number
  status: string
  pdf_url?: string
}

export default function CertificadosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([])
  const [filteredCertificates, setFilteredCertificates] = useState<CertificateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [turmas, setTurmas] = useState<string[]>([])
  
  // Estados de filtro
  const [filterName, setFilterName] = useState("")
  const [filterTurma, setFilterTurma] = useState("")
  const [filterDate, setFilterDate] = useState("")

  useEffect(() => {
    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    loadData()
  }, [user, router])

  // Aplicar filtros
  useEffect(() => {
    let filtered = certificates

    // Filtrar por nome do aluno
    if (filterName) {
      filtered = filtered.filter((cert) =>
        cert.aluno_name.toLowerCase().includes(filterName.toLowerCase())
      )
    }

    // Filtrar por turma
    if (filterTurma) {
      filtered = filtered.filter((cert) =>
        cert.turma_name.toLowerCase().includes(filterTurma.toLowerCase())
      )
    }

    // Filtrar por data
    if (filterDate) {
      filtered = filtered.filter((cert) => {
        const certDate = new Date(cert.issue_date).toLocaleDateString("pt-AO")
        return certDate.includes(filterDate)
      })
    }

    setFilteredCertificates(filtered)
  }, [certificates, filterName, filterTurma, filterDate])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar certificados
      const { data: certsData, error: certsError } = await supabase
        .from("certificates_detailed")
        .select("*")
        .eq("centro_id", user?.centroId)
        .order("issue_date", { ascending: false })

      if (certsError) throw certsError
      setCertificates(certsData || [])
      setFilteredCertificates(certsData || [])
      
      // Extrair turmas únicas
      const uniqueTurmas = Array.from(
        new Set((certsData || []).map((cert) => cert.turma_name))
      ).sort()
      setTurmas(uniqueTurmas)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <CentroSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Certificados</h1>
              <p className="text-blue-200">Gerencie os certificados de seus alunos</p>
            </div>
            <Link href="/dashboard/certificados/emitir">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
                <Plus className="h-4 w-4" />
                Emitir Certificado
              </Button>
            </Link>
          </div>

          {/* Lista de Certificados */}
          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader className="border-b border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Certificados Emitidos</CardTitle>
                  <CardDescription className="text-blue-300">
                    Total: {filteredCertificates.length} certificado(s)
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-blue-700 hover:bg-blue-600 text-white gap-2">
                      <Filter className="h-4 w-4" />
                      Filtrar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Nome do Aluno
                        </label>
                        <Input
                          placeholder="Ex: João Silva"
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          className="bg-blue-900/50 border-blue-700 text-white placeholder:text-blue-400"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Turma
                        </label>
                        <Select value={filterTurma} onValueChange={setFilterTurma}>
                          <SelectTrigger className="bg-blue-900/50 border-blue-700 text-white">
                            <SelectValue placeholder="Selecione uma turma" />
                          </SelectTrigger>
                          <SelectContent>
                            {turmas.map((turma) => (
                              <SelectItem key={turma} value={turma}>
                                {turma}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white mb-2 block">
                          Data (DD/MM/YYYY)
                        </label>
                        <Input
                          placeholder="Ex: 29/12/2025"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="bg-blue-900/50 border-blue-700 text-white placeholder:text-blue-400"
                        />
                      </div>

                      <Button
                        onClick={() => {
                          setFilterName("")
                          setFilterTurma("")
                          setFilterDate("")
                        }}
                        variant="outline"
                        className="w-full text-white border-blue-600 hover:bg-blue-900/30"
                      >
                        Limpar Filtros
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {filteredCertificates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300">
                    {certificates.length === 0
                      ? "Nenhum certificado emitido ainda"
                      : "Nenhum certificado encontrado com os filtros aplicados"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-700 hover:bg-blue-800/50">
                        <TableHead className="text-blue-200">Nº Certificado</TableHead>
                        <TableHead className="text-blue-200">Aluno</TableHead>
                        <TableHead className="text-blue-200">Turma</TableHead>
                        <TableHead className="text-blue-200">Formação</TableHead>
                        <TableHead className="text-blue-200">Data Emissão</TableHead>
                        <TableHead className="text-blue-200">Nota Final</TableHead>
                        <TableHead className="text-blue-200">Status</TableHead>
                        <TableHead className="text-blue-200">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertificates.map((cert) => (
                        <TableRow
                          key={cert.id}
                          className="border-blue-700 hover:bg-blue-800/30"
                        >
                          <TableCell className="font-mono text-sm text-blue-100">
                            {cert.certificate_number}
                          </TableCell>
                          <TableCell className="text-white">{cert.aluno_name}</TableCell>
                          <TableCell className="text-blue-100">{cert.turma_name}</TableCell>
                          <TableCell className="text-blue-100">{cert.formacao_name}</TableCell>
                          <TableCell className="text-blue-100">
                            {new Date(cert.issue_date).toLocaleDateString("pt-AO")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-semibold">
                                {cert.final_grade.toFixed(2)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                cert.status === "issued" ? "default" : "destructive"
                              }
                            >
                              {cert.status === "issued" ? "Emitido" : "Revogado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cert.pdf_url ? (
                              <a
                                href={cert.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={`${cert.certificate_number}.pdf`}
                                className="inline-flex items-center justify-center gap-1 p-2 rounded-md bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 hover:text-orange-200 transition-all hover:scale-110"
                                title="Baixar certificado"
                              >
                                <Download className="h-5 w-5" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center justify-center p-2 text-blue-500">
                                <Download className="h-5 w-5 opacity-30" />
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
