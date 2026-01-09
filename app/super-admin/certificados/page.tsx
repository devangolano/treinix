"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { FileText, Loader2, BarChart3, Settings, Award } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
import { SuperAdminSidebar } from "@/components/super-admin-sidebar"

interface CertificateDetail {
  id: string
  certificate_number: string
  aluno_name: string
  aluno_email: string
  turma_name: string
  formacao_name: string
  centro_name: string
  template_name: string
  issue_date: string
  status: string
}

interface CentroStats {
  centro_name: string
  total_certificados: number
  certificados_ativos: number
  certificados_revogados: number
}

export default function CertificadosPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [certificates, setCertificates] = useState<CertificateDetail[]>([])
  const [stats, setStats] = useState<CentroStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Se ainda está carregando autenticação, não faz nada
    if (isLoading) {
      return
    }

    // Se não está autenticado, redireciona
    if (!user) {
      router.push("/login")
      return
    }

    // Se não é super_admin, redireciona para dashboard
    if (user.role !== "super_admin") {
      router.push("/dashboard")
      return
    }

    loadData()
  }, [isLoading, user, router])

  const loadData = async () => {
    try {
      // Carregar certificados detalhados
      const { data: certsData, error: certsError } = await supabase
        .from("certificates_detailed")
        .select("*")
        .order("issue_date", { ascending: false })
        .limit(50)

      if (certsError) throw certsError
      setCertificates(certsData || [])

      // Calcular estatísticas
      const { data: allCerts, error: allCertsError } = await supabase
        .from("certificates_detailed")
        .select("centro_name, status")

      if (allCertsError) throw allCertsError

      // Agrupar por centro
      const statsMap = new Map<string, CentroStats>()
      allCerts?.forEach((cert) => {
        const existing = statsMap.get(cert.centro_name) || {
          centro_name: cert.centro_name,
          total_certificados: 0,
          certificados_ativos: 0,
          certificados_revogados: 0,
        }

        existing.total_certificados++
        if (cert.status === "issued") {
          existing.certificados_ativos++
        } else {
          existing.certificados_revogados++
        }

        statsMap.set(cert.centro_name, existing)
      })

      setStats(Array.from(statsMap.values()))
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
        <SuperAdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
      <SuperAdminSidebar />

      <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
        <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Certificados</h1>
              <p className="text-blue-200">Monitore certificados de todos os centros</p>
            </div>
            <Link href="/super-admin/certificados/templates">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold gap-2">
                <Settings className="h-4 w-4" />
                Gerenciar Modelos
              </Button>
            </Link>
          </div>

          {/* Estatísticas por Centro */}
          {stats.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Estatísticas por Centro</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                  <Card
                    key={stat.centro_name}
                    className="bg-blue-900/30 border-blue-800"
                  >
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{stat.centro_name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-blue-300">Total</p>
                          <p className="text-2xl font-bold text-white">
                            {stat.total_certificados}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-300">Ativos</p>
                          <p className="text-2xl font-bold text-green-400">
                            {stat.certificados_ativos}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-300">Revogados</p>
                          <p className="text-2xl font-bold text-red-400">
                            {stat.certificados_revogados}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Certificados */}
          <Card className="bg-blue-900/30 border-blue-800">
            <CardHeader className="border-b border-blue-800">
              <CardTitle className="text-white">Certificados Recentes</CardTitle>
              <CardDescription className="text-blue-300">
                Últimos 50 certificados emitidos em todo o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {certificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                  <p className="text-blue-300">Nenhum certificado emitido</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-blue-700 hover:bg-blue-800/50">
                        <TableHead className="text-blue-200">Nº Certificado</TableHead>
                        <TableHead className="text-blue-200">Aluno</TableHead>
                        <TableHead className="text-blue-200">Centro</TableHead>
                        <TableHead className="text-blue-200">Turma</TableHead>
                        <TableHead className="text-blue-200">Modelo</TableHead>
                        <TableHead className="text-blue-200">Data Emissão</TableHead>
                        <TableHead className="text-blue-200">Status</TableHead>
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
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{cert.aluno_name}</p>
                              <p className="text-xs text-blue-300">{cert.aluno_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{cert.centro_name}</TableCell>
                          <TableCell className="text-blue-100">{cert.turma_name}</TableCell>
                          <TableCell className="text-blue-100">{cert.template_name}</TableCell>
                          <TableCell className="text-blue-100">
                            {new Date(cert.issue_date).toLocaleDateString("pt-AO")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                cert.status === "issued"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {cert.status === "issued"
                                ? "Emitido"
                                : "Revogado"}
                            </Badge>
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
