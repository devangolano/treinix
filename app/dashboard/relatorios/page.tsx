"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { pagamentoService, formacaoService, turmaService, alunoService, centroService } from "@/lib/supabase-services"
import { useAuth } from "@/hooks/use-auth"
import { Download, DollarSign, TrendingUp, AlertCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import type { Pagamento, Formacao, Turma, Aluno } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { generatePDF } from "@/lib/pdf-generator"

export default function RelatoriosFinanceirosPage() {
    const { user } = useAuth()
    const router = useRouter()
    const { toast } = useToast()

    const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
    const [formacoes, setFormacoes] = useState<Formacao[]>([])
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [alunos, setAlunos] = useState<Aluno[]>([])
    const [loading, setLoading] = useState(true)
    const [filtrosAbertos, setFiltrosAbertos] = useState(false)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [centroInfo, setCentroInfo] = useState({ nome: "", email: "", telefone: "", endereco: "", nif: "" })
    const ITENS_POR_PAGINA = 15

    // Filtros - com datas padrão (hoje até fim do mês)
    const hoje = new Date()
    const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

    const [filtroDataInicio, setFiltroDataInicio] = useState(hoje.toISOString().split("T")[0])
    const [filtroDataFim, setFiltroDataFim] = useState(ultimoDiaDoMes.toISOString().split("T")[0])
    const [filtroFormacao, setFiltroFormacao] = useState("")
    const [filtroTurma, setFiltroTurma] = useState("")
    const [filtroStatus, setFiltroStatus] = useState("")

    useEffect(() => {
        if (!user?.centroId) {
            router.push("/login")
            return
        }

        loadFinancialData()
    }, [user?.centroId, router])

    const loadFinancialData = async () => {
        try {
            setLoading(true)
            if (!user?.centroId) return

            const [pagData, formData, turmaData, alunoData, centroData] = await Promise.all([
                pagamentoService.getAll(user.centroId),
                formacaoService.getAll(user.centroId),
                turmaService.getAll(user.centroId),
                alunoService.getAll(user.centroId),
                centroService.getById(user.centroId),
            ])

            setPagamentos(pagData)
            setFormacoes(formData)
            setTurmas(turmaData)
            setAlunos(alunoData)
            
            // Armazenar dados do centro
            if (centroData) {
                setCentroInfo({
                    nome: centroData.name || "",
                    email: centroData.email || "",
                    telefone: centroData.phone || "",
                    endereco: centroData.address || "",
                    nif: centroData.nif || "",
                })
            }
        } catch (error) {
            console.error("Erro ao carregar dados financeiros:", error)
            toast({
                title: "Erro ao carregar dados",
                description: "Não foi possível carregar os dados financeiros.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // ========== FILTRAR PAGAMENTOS ==========
    const pagamentosFiltrados = pagamentos.filter((pag) => {
        // Filtro por data
        if (filtroDataInicio) {
            const dataInicio = new Date(filtroDataInicio)
            if (new Date(pag.createdAt) < dataInicio) return false
        }
        if (filtroDataFim) {
            const dataFim = new Date(filtroDataFim)
            dataFim.setHours(23, 59, 59)
            if (new Date(pag.createdAt) > dataFim) return false
        }

        // Filtro por formação
        if (filtroFormacao) {
            const aluno = alunos.find((a) => a.id === pag.alunoId)
            if (aluno?.formacaoId !== filtroFormacao) return false
        }

        // Filtro por turma
        if (filtroTurma && pag.turmaId !== filtroTurma) return false

        // Filtro por status
        if (filtroStatus && pag.status !== filtroStatus) return false

        return true
    })

    // ========== CÁLCULOS ==========
    const pagamentosCompletos = pagamentosFiltrados.filter((p) => p.status === "completed")
    const pagamentosParciais = pagamentosFiltrados.filter((p) => p.status === "partial")
    const pagamentosPendentes = pagamentosFiltrados.filter((p) => p.status === "pending")
    const pagamentosCancelados = pagamentosFiltrados.filter((p) => p.status === "cancelled")

    const totalCobrado = pagamentosFiltrados.reduce((sum, p) => sum + p.amount, 0)
    const totalRecebido = pagamentosCompletos.reduce((sum, p) => sum + p.amount, 0)
    const totalParcial = pagamentosParciais.reduce((sum, p) => sum + (p.amount * p.installmentsPaid) / p.installments, 0)
    const totalPendente = pagamentosPendentes.reduce((sum, p) => sum + p.amount, 0)
    const totalAReceber = totalPendente + (pagamentosParciais.reduce((sum, p) => sum + p.amount * (1 - p.installmentsPaid / p.installments), 0))

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
            default:
                return "Desconhecido"
        }
    }

    const getNomeAluno = (alunoId: string) => {
        return alunos.find((a) => a.id === alunoId)?.name || "N/A"
    }

    const getNomeFormacao = (formacaoId: string | undefined) => {
        return formacoes.find((f) => f.id === formacaoId)?.name || "N/A"
    }

    const getNomeTurma = (turmaId: string) => {
        return turmas.find((t) => t.id === turmaId)?.name || "N/A"
    }

    const handleExportPDF = async () => {
        try {
            const dataParaExportar = pagamentosFiltrados.map((pag) => ({
                aluno: getNomeAluno(pag.alunoId),
                formacao: getNomeFormacao(alunos.find((a) => a.id === pag.alunoId)?.formacaoId),
                turma: getNomeTurma(pag.turmaId),
                valor: formatCurrency(pag.amount),
                parcelas: `${pag.installmentsPaid}/${pag.installments}`,
                metodo: pag.paymentMethod,
                data: formatDate(pag.createdAt),
                status: getPaymentStatusLabel(pag.status),
            }))

            const centroData = {
                nome: centroInfo.nome || "Centro de Formação",
                email: centroInfo.email || "",
                telefone: centroInfo.telefone || "",
                endereco: centroInfo.endereco || "",
                nif: centroInfo.nif || "",
            }

            await generatePDF(
                "Relatório de Pagamentos",
                dataParaExportar,
                {
                    totalCobrado,
                    totalRecebido,
                    totalParcial,
                    totalPendente,
                    formatCurrency,
                    centroData,
                }
            )

            toast({
                title: "Sucesso!",
                description: "PDF exportado com sucesso.",
                variant: "default",
            })
        } catch (error) {
            console.error("Erro ao exportar PDF:", error)
            toast({
                title: "Erro ao exportar",
                description: "Não foi possível gerar o PDF.",
                variant: "destructive",
            })
        }
    }

    const resetFiltros = () => {
        setFiltroDataInicio("")
        setFiltroDataFim("")
        setFiltroFormacao("")
        setFiltroTurma("")
        setFiltroStatus("")
        setPaginaAtual(1) // Resetar para primeira página
    }

    // ========== PAGINAÇÃO ==========
    const totalPaginas = Math.ceil(pagamentosFiltrados.length / ITENS_POR_PAGINA)
    const indiceInicial = (paginaAtual - 1) * ITENS_POR_PAGINA
    const indiceFinal = indiceInicial + ITENS_POR_PAGINA
    const pagamentosPaginados = pagamentosFiltrados.slice(indiceInicial, indiceFinal)

    // Resetar para primeira página quando os filtros mudam
    useEffect(() => {
        setPaginaAtual(1)
    }, [filtroDataInicio, filtroDataFim, filtroFormacao, filtroTurma, filtroStatus])

    if (!user) return null

    if (loading) {
        return (
            <div className="flex h-screen flex-col md:flex-row bg-slate-900">
                <CentroSidebar />
                <div className="flex-1 flex items-center justify-center bg-slate-900">
                    <Spinner />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col md:flex-row bg-slate-900">
            <CentroSidebar />

            <div className="flex-1 overflow-auto pt-16 md:pt-0 bg-slate-900">
                <div className="container max-w-7xl py-6 md:py-8 px-4 md:px-6">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Relatórios Financeiros</h1>
                            <p className="text-blue-200 mt-2">Acompanhe os pagamentos dos alunos e parcelas a receber</p>
                        </div>
                    </div>

                    {/* ========== ESTATÍSTICAS ==========*/}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Card Completos */}
                        <div className="bg-linear-to-r from-green-600/20 to-green-700/20 rounded-lg border border-green-700/30 p-5 backdrop-blur-sm hover:border-green-600/50 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-300">Pagamentos Completos</p>
                                    <p className="text-3xl font-bold text-green-400 mt-2">{pagamentosCompletos.length}</p>
                                    <p className="text-sm text-green-300/70 mt-2">{formatCurrency(totalRecebido)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center border border-green-600/40">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Card Parciais */}
                        <div className="bg-linear-to-r from-blue-600/20 to-blue-700/20 rounded-lg border border-blue-700/30 p-5 backdrop-blur-sm hover:border-blue-600/50 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-300">Pagamentos Parciais</p>
                                    <p className="text-3xl font-bold text-blue-400 mt-2">{pagamentosParciais.length}</p>
                                    <p className="text-sm text-blue-300/70 mt-2">{formatCurrency(totalParcial)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/40">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Card Pendentes */}
                        <div className="bg-linear-to-r from-yellow-600/20 to-yellow-700/20 rounded-lg border border-yellow-700/30 p-5 backdrop-blur-sm hover:border-yellow-600/50 transition-all duration-300">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-300">Pagamentos Pendentes</p>
                                    <p className="text-3xl font-bold text-yellow-400 mt-2">{pagamentosPendentes.length}</p>
                                    <p className="text-sm text-yellow-300/70 mt-2">{formatCurrency(totalPendente)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center border border-yellow-600/40">
                                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ========== BOTÃO FILTROS E DOWNLOADS==========*/}
                    <div className="mb-6 flex gap-4 justify-end">
                        <Button
                            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
                            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            <Filter className="h-4 w-4" />
                            {filtrosAbertos ? "Fechar Filtros" : "Abrir Filtros"}
                        </Button>
                        <Button
                            onClick={handleExportPDF}
                            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            <Download className="h-4 w-4" />
                            Exportar PDF
                        </Button>
                    </div>

                    {/* ========== CARD FILTROS (Modal) ==========*/}
                    {filtrosAbertos && (
                        <Card className="bg-blue-900/30 border-blue-800/50 mb-8 animate-in">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-blue-400" />
                                    Filtros Avançados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* Filtro Data Início */}
                                    <div>
                                        <label className="block text-sm text-blue-300 mb-2">Data Início</label>
                                        <input
                                            type="date"
                                            value={filtroDataInicio}
                                            onChange={(e) => setFiltroDataInicio(e.target.value)}
                                            className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 text-white rounded focus:outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    {/* Filtro Data Fim */}
                                    <div>
                                        <label className="block text-sm text-blue-300 mb-2">Data Fim</label>
                                        <input
                                            type="date"
                                            value={filtroDataFim}
                                            onChange={(e) => setFiltroDataFim(e.target.value)}
                                            className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 text-white rounded focus:outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    {/* Filtro Formação */}
                                    <div>
                                        <label className="block text-sm text-blue-300 mb-2">Formação</label>
                                        <select
                                            value={filtroFormacao}
                                            onChange={(e) => setFiltroFormacao(e.target.value)}
                                            className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 text-white rounded focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="">Todas</option>
                                            {formacoes.map((form) => (
                                                <option key={form.id} value={form.id}>
                                                    {form.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtro Turma */}
                                    <div>
                                        <label className="block text-sm text-blue-300 mb-2">Turma</label>
                                        <select
                                            value={filtroTurma}
                                            onChange={(e) => setFiltroTurma(e.target.value)}
                                            className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 text-white rounded focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="">Todas</option>
                                            {turmas.map((turma) => (
                                                <option key={turma.id} value={turma.id}>
                                                    {turma.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Filtro Status */}
                                    <div>
                                        <label className="block text-sm text-blue-300 mb-2">Status</label>
                                        <select
                                            value={filtroStatus}
                                            onChange={(e) => setFiltroStatus(e.target.value)}
                                            className="w-full px-3 py-2 bg-blue-800/30 border border-blue-700/50 text-white rounded focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="">Todos</option>
                                            <option value="completed">Pago</option>
                                            <option value="partial">Parcial</option>
                                            <option value="pending">Pendente</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6 flex-col md:flex-row">
                                    <Button
                                        onClick={resetFiltros}
                                        variant="outline"
                                        className="w-full md:w-auto bg-blue-800/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/50"
                                    >
                                        Limpar Filtros
                                    </Button>
                                    <Button
                                        onClick={() => setFiltrosAbertos(false)}
                                        className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                                    >
                                        Aplicar Filtros
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* ========== TABELA DE PAGAMENTOS ==========*/}
                    <Card className="bg-blue-900/30 border-blue-800/50">
                        <CardHeader>
                            <CardTitle className="text-white">Detalhamento de Pagamentos</CardTitle>
                            <CardDescription className="text-blue-300">
                                {pagamentosFiltrados.length} pagamento(s) encontrado(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pagamentosFiltrados.length === 0 ? (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                                    <p className="text-blue-300">Nenhum pagamento encontrado com os filtros selecionados</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-blue-800/50">
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Aluno</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Formação</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Turma</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Valor</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Parcelas</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Método</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Data</th>
                                                    <th className="text-left py-3 px-3 font-semibold text-blue-300">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pagamentosPaginados.map((pag) => (
                                                    <tr key={pag.id} className="border-b border-blue-800/30 hover:bg-blue-900/20">
                                                        <td className="py-3 px-3 text-blue-100 font-medium">{getNomeAluno(pag.alunoId)}</td>
                                                        <td className="py-3 px-3 text-blue-300">{getNomeFormacao(alunos.find((a) => a.id === pag.alunoId)?.formacaoId)}</td>
                                                        <td className="py-3 px-3 text-blue-300">{getNomeTurma(pag.turmaId)}</td>
                                                        <td className="py-3 px-3 text-blue-100 font-semibold">{formatCurrency(pag.amount)}</td>
                                                        <td className="py-3 px-3 text-blue-300">
                                                            {pag.installmentsPaid}/{pag.installments}
                                                        </td>
                                                        <td className="py-3 px-3 text-blue-300 capitalize">{pag.paymentMethod}</td>
                                                        <td className="py-3 px-3 text-blue-300">{formatDate(pag.createdAt)}</td>
                                                        <td className="py-3 px-3">
                                                            <Badge className={getPaymentStatusColor(pag.status)}>
                                                                {getPaymentStatusLabel(pag.status)}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ========== CONTROLES DE PAGINAÇÃO ==========*/}
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-blue-800/50">
                                        <div className="text-sm text-blue-300">
                                            Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, pagamentosFiltrados.length)} de {pagamentosFiltrados.length} pagamento(s)
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                                                disabled={paginaAtual === 1}
                                                variant="outline"
                                                size="sm"
                                                className="bg-blue-800/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>

                                            <div className="flex items-center gap-2">
                                                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                                                    <Button
                                                        key={pagina}
                                                        onClick={() => setPaginaAtual(pagina)}
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
                                                onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                                                disabled={paginaAtual === totalPaginas}
                                                variant="outline"
                                                size="sm"
                                                className="bg-blue-800/30 text-blue-300 border-blue-700/50 hover:bg-blue-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
