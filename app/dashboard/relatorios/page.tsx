"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CentroSidebar } from "@/components/centro-sidebar"
import { Spinner } from "@/components/ui/spinner"
import { pagamentoService, formacaoService, turmaService, alunoService, centroService, matriculaService, pagamentoInstallmentService } from "@/lib/supabase-services"
import { useAuth } from "@/hooks/use-auth"
import { Download, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Pagamento, Formacao, Turma, Aluno, Matricula } from "@/lib/types"
import { generatePDF } from "@/lib/pdf-generator"
import { SummaryCards } from "@/components/relativos/summary-cards"
import { FilterModal } from "@/components/relativos/filter-modal"
import { PaymentTable } from "@/components/relativos/payment-table"

export default function RelatoriosFinanceirosPage() {
    const { user } = useAuth()
    const router = useRouter()

    const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
    const [formacoes, setFormacoes] = useState<Formacao[]>([])
    const [turmas, setTurmas] = useState<Turma[]>([])
    const [alunos, setAlunos] = useState<Aluno[]>([])
    const [matriculas, setMatriculas] = useState<Matricula[]>([])
    const [loading, setLoading] = useState(true)
    const [filtrosAbertos, setFiltrosAbertos] = useState(false)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [centroInfo, setCentroInfo] = useState({ nome: "", email: "", telefone: "", endereco: "", nif: "" })
    const [installmentStats, setInstallmentStats] = useState<Record<string, { paidCount: number; totalCount: number }>>({})
    const ITENS_POR_PAGINA = 15

    // Filtros - com datas padrão (hoje até fim do mês)
    const hoje = new Date()
    const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

    const [filtros, setFiltros] = useState({
        dataInicio: hoje.toISOString().split("T")[0],
        dataFim: ultimoDiaDoMes.toISOString().split("T")[0],
        formacao: "",
        turma: "",
        status: "",
    })

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

            const [pagData, formData, turmaData, alunoData, centroData, matData] = await Promise.all([
                pagamentoService.getAll(user.centroId),
                formacaoService.getAll(user.centroId),
                turmaService.getAll(user.centroId),
                alunoService.getAll(user.centroId),
                centroService.getById(user.centroId),
                matriculaService.getAll(user.centroId),
            ])

            setPagamentos(pagData)
            setFormacoes(formData)
            setTurmas(turmaData)
            setAlunos(alunoData)
            setMatriculas(matData)

            // Carregar stats de prestações para cada pagamento
            const stats: Record<string, { paidCount: number; totalCount: number }> = {}
            for (const pagamento of pagData) {
                try {
                    const installments = await pagamentoInstallmentService.getByPagamentoId(pagamento.id)
                    const paidCount = installments.filter((i) => i.status === "paid").length
                    stats[pagamento.id] = {
                        paidCount,
                        totalCount: installments.length,
                    }
                } catch (error) {
                    console.error(`Erro ao buscar prestações do pagamento ${pagamento.id}:`, error)
                    stats[pagamento.id] = { paidCount: 0, totalCount: 0 }
                }
            }
            setInstallmentStats(stats)

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
            toast.error("Erro ao carregar dados financeiros!")
        } finally {
            setLoading(false)
        }
    }

    // ========== FUNÇÃO PARA RECALCULAR STATUS REAL ==========
    // Baseado nas prestações pagas, recalcula o status do pagamento
    const getRealStatus = (pagamento: Pagamento): "pending" | "partial" | "completed" | "cancelled" => {
        const stats = installmentStats[pagamento.id]
        if (!stats) return pagamento.status

        // Se todas as prestações foram pagas
        if (stats.paidCount === stats.totalCount && stats.totalCount > 0) {
            return "completed"
        }
        // Se algumas prestações foram pagas
        if (stats.paidCount > 0 && stats.paidCount < stats.totalCount) {
            return "partial"
        }
        // Se nenhuma prestação foi paga
        return pagamento.status
    }

    // Criar array de pagamentos com status recalculado (com type cast correto)
    const pagamentosComStatusReal = pagamentos.map((pag): Pagamento => {
        const realStatus = getRealStatus(pag)
        return {
            ...pag,
            status: realStatus,
        }
    })

    // ========== FILTRAR PAGAMENTOS ==========
    const pagamentosFiltrados = pagamentosComStatusReal.filter((pag) => {
        // Filtro por data
        if (filtros.dataInicio) {
            const dataInicio = new Date(filtros.dataInicio)
            if (new Date(pag.createdAt) < dataInicio) return false
        }
        if (filtros.dataFim) {
            const dataFim = new Date(filtros.dataFim)
            dataFim.setHours(23, 59, 59)
            if (new Date(pag.createdAt) > dataFim) return false
        }

        // Filtro por formação
        if (filtros.formacao) {
            const matricula = matriculas.find((m) => m.id === pag.matriculaId)
            if (matricula?.formacaoId !== filtros.formacao) return false
        }

        // Filtro por turma
        if (filtros.turma && pag.turmaId !== filtros.turma) return false

        // Filtro por status (usando status recalculado)
        if (filtros.status) {
            // "Recebido" = completed + partial (já recebemos algo)
            if (filtros.status === "completed" && pag.status !== "completed" && pag.status !== "partial") return false
            // "A Receber" = pending + partial (ainda falta receber)
            if (filtros.status === "pending_partial" && pag.status !== "pending" && pag.status !== "partial") return false
        }

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

    // ========== FUNÇÕES AUXILIARES ==========
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

    const getNomeAluno = (alunoId: string) => {
        return alunos.find((a) => a.id === alunoId)?.name || "N/A"
    }

    const getNomeFormacao = (formacaoId: string | undefined) => {
        return formacoes.find((f) => f.id === formacaoId)?.name || "N/A"
    }

    const getNomeTurma = (turmaId: string) => {
        return turmas.find((t) => t.id === turmaId)?.name || "N/A"
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

    const handleExportPDF = async () => {
        try {
            const dataParaExportar = pagamentosFiltrados.map((pag) => ({
                aluno: getNomeAluno(pag.alunoId),
                formacao: getNomeFormacao(matriculas.find((m) => m.id === pag.matriculaId)?.formacaoId),
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

            toast.success("PDF exportado com sucesso!")
        } catch (error) {
            console.error("Erro ao exportar PDF:", error)
            toast.error("Erro ao exportar PDF!")
        }
    }

    const handleFiltroChange = (key: string, value: string) => {
        setFiltros(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const resetFiltros = () => {
        setFiltros({
            dataInicio: "",
            dataFim: "",
            formacao: "",
            turma: "",
            status: "",
        })
        setPaginaAtual(1)
    }

    // ========== PAGINAÇÃO ==========
    const totalPaginas = Math.ceil(pagamentosFiltrados.length / ITENS_POR_PAGINA)

    // Resetar para primeira página quando os filtros mudam
    useEffect(() => {
        setPaginaAtual(1)
    }, [filtros.dataInicio, filtros.dataFim, filtros.formacao, filtros.turma, filtros.status])

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
                            <h1 className="text-4xl font-bold bg-linear-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                                Relatórios Financeiros
                            </h1>
                            <p className="text-blue-200 mt-2 text-lg">
                                Dashboard profissional de pagamentos e receita
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setFiltrosAbertos(true)}
                                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-fit"
                            >
                                <Filter className="h-4 w-4" />
                                Filtros
                            </Button>
                            <Button
                                onClick={handleExportPDF}
                                className="gap-2 bg-orange-500 hover:bg-orange-600 text-white w-fit"
                            >
                                <Download className="h-4 w-4" />
                                Exportar PDF
                            </Button>
                        </div>
                    </div>

                    {/* Estatísticas */}
                    <SummaryCards
                        pagamentos={pagamentosComStatusReal}
                        matriculas={matriculas}
                        formacoes={formacoes}
                    />

                    {/* Tabela de Pagamentos */}
                    <PaymentTable
                        pagamentos={pagamentosFiltrados}
                        alunos={alunos}
                        turmas={turmas}
                        formacoes={formacoes}
                        matriculas={matriculas}
                        totalPaginas={totalPaginas}
                        paginaAtual={paginaAtual}
                        onPaginaChange={setPaginaAtual}
                    />

                    {/* Filtros em Modal */}
                    <FilterModal
                        isOpen={filtrosAbertos}
                        onOpenChange={setFiltrosAbertos}
                        formacoes={formacoes}
                        turmas={turmas}
                        filtros={filtros}
                        onFiltroChange={handleFiltroChange}
                        onReset={resetFiltros}
                    />
                </div>
            </div>
        </div>
    )
}
