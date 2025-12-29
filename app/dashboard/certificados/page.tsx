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
import { Plus, FileText, Loader2, Award } from "lucide-react"
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
  status: string
  pdf_url?: string
}

interface TurmaSummary {
  turma_id: string
  turma_name: string
  formacao_name: string
  total_alunos: number
  certificados_emitidos: number
  alunos_sem_certificado: number
}

export default function CertificadosPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([])
  const [turmasSummary, setTurmasSummary] = useState<TurmaSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !user.centroId) {
      router.push("/login")
      return
    }

    loadData()
  }, [user, router])

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

      // Carregar resumo por turma
      const { data: turmasData, error: turmasError } = await supabase
        .from("certificates_summary_by_turma")
        .select("*")
        .order("turma_name")

      if (turmasError) throw turmasError
      setTurmasSummary(turmasData || [])
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

          {/* Resumo por Turma */}
          {turmasSummary.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Resumo por Turma</h2>
              {turmasSummary.length === 0 ? (
                <Card className="bg-blue-900/30 border-blue-800">
                  <CardContent className="py-12 text-center">
                    <Award className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <p className="text-blue-300">Nenhuma turma com certificados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {turmasSummary.map((turma) => (
                    <Card
                      key={turma.turma_id}
                      className="bg-blue-900/30 border-blue-800 hover:border-orange-500 transition-colors"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-blue-300">Turma</p>
                            <p className="text-lg font-semibold text-white">{turma.turma_name}</p>
                            <p className="text-sm text-blue-200">{turma.formacao_name}</p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-700">
                            <div>
                              <p className="text-sm text-blue-300">Total Alunos</p>
                              <p className="text-2xl font-bold text-white">
                                {turma.total_alunos}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-300">Certificados</p>
                              <p className="text-2xl font-bold text-green-400">
                                {turma.certificados_emitidos}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-blue-300">Pendentes</p>
                              <p className="text-2xl font-bold text-amber-400">
                                {turma.alunos_sem_certificado}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista de Certificados */}
          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader className="border-b border-blue-800">
              <CardTitle className="text-white">Certificados Emitidos</CardTitle>
              <CardDescription className="text-blue-300">
                Histórico de todos os certificados emitidos
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {certificates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300">Nenhum certificado emitido ainda</p>
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
                        <TableHead className="text-blue-200">Status</TableHead>
                        <TableHead className="text-blue-200">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((cert) => (
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
                                className="text-orange-400 hover:text-orange-300 text-sm font-medium"
                              >
                                Ver PDF
                              </a>
                            ) : (
                              <span className="text-blue-400 text-sm">—</span>
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
