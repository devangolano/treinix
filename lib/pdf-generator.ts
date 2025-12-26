import { PDFDocument, rgb, PDFPage } from "pdf-lib"

interface AlunoFichaData {
  name: string
  email: string
  phone: string
  bi: string
  birthDate: Date | string
  address: string
  formacaoName: string
  turmaName: string
  status: string
  createdAt: Date | string
  centroName?: string
  centroEmail?: string
  centroPhone?: string
  centroAddress?: string
  paymentMethod?: string
  paymentStatus?: "paid" | "half-paid" | "pending"
  installmentsPaid?: number
  totalInstallments?: number
  systemPhone?: string
}

export async function generateAlunoPDF(alunoData: AlunoFichaData) {
  try {
    // Criar novo documento PDF
    const pdfDoc = await PDFDocument.create()
    
    // Adicionar uma página A4
    const page = pdfDoc.addPage([595, 842]) // A4 em points
    const { width, height } = page.getSize()

    // Cores
    const darkBlue = rgb(30 / 255, 58 / 255, 138 / 255) // #1e3a8a
    const darkGray = rgb(102 / 255, 102 / 255, 102 / 255) // #666666
    const mediumGray = rgb(80 / 255, 80 / 255, 80 / 255) // #505050 (mais legível)
    const black = rgb(0, 0, 0)
    const lightGreen = rgb(220 / 255, 252 / 255, 231 / 255) // #dcfce7
    const darkGreen = rgb(22 / 255, 101 / 255, 52 / 255) // #166534
    const lightRed = rgb(254 / 255, 226 / 255, 226 / 255) // #fee2e2
    const darkRed = rgb(153 / 255, 27 / 255, 27 / 255) // #991b1b

    let yPosition = 50

    // Dados do Centro destacados (apenas negrito)
    if (alunoData.centroName) {
      page.drawText(alunoData.centroName, {
        x: 50,
        y: height - yPosition,
        size: 16,
        color: darkBlue,
      })
      yPosition += 18
    }

    if (alunoData.centroEmail) {
      page.drawText(`Email: ${alunoData.centroEmail}`, {
        x: 50,
        y: height - yPosition,
        size: 10,
        color: black,
      })
      yPosition += 14
    }

    if (alunoData.centroPhone) {
      page.drawText(`Telefone: ${alunoData.centroPhone}`, {
        x: 50,
        y: height - yPosition,
        size: 10,
        color: black,
      })
      yPosition += 14
    }

    if (alunoData.centroAddress) {
      page.drawText(`Localização: ${alunoData.centroAddress}`, {
        x: 50,
        y: height - yPosition,
        size: 10,
        color: black,
      })
      yPosition += 14
    }

    yPosition += 12
    // Linha separadora
    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 2,
      color: darkBlue,
    })

    // INFORMAÇÕES PESSOAIS
    yPosition += 25
    page.drawText("INFORMAÇÕES PESSOAIS", {
      x: 50,
      y: height - yPosition,
      size: 14,
      color: darkBlue,
    })

    yPosition += 20
    page.drawText("Nome Completo", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    page.drawText(alunoData.name, {
      x: 50,
      y: height - yPosition,
      size: 11,
      color: black,
    })

    // Email e Telefone em coluna
    yPosition += 18
    page.drawText("Email", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })
    page.drawText("Telefone", {
      x: 320,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    page.drawText(alunoData.email, {
      x: 50,
      y: height - yPosition,
      size: 10,
      color: black,
    })
    page.drawText(alunoData.phone, {
      x: 320,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // BI e Data de Nascimento
    yPosition += 18
    page.drawText("Documento de Identidade", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })
    page.drawText("Data de Nascimento", {
      x: 320,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    page.drawText(alunoData.bi, {
      x: 50,
      y: height - yPosition,
      size: 10,
      color: black,
    })
    page.drawText(new Date(alunoData.birthDate).toLocaleDateString("pt-AO"), {
      x: 320,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // Endereço
    yPosition += 18
    page.drawText("Endereço", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    page.drawText(alunoData.address, {
      x: 50,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // Linha separadora
    yPosition += 18
    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 2,
      color: darkBlue,
    })

    // MATRÍCULA ACADÊMICA
    yPosition += 25
    page.drawText("MATRÍCULA ACADÊMICA", {
      x: 50,
      y: height - yPosition,
      size: 14,
      color: darkBlue,
    })

    // Formação e Turma
    yPosition += 20
    page.drawText("Formação", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })
    page.drawText("Turma", {
      x: 320,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    page.drawText(alunoData.formacaoName, {
      x: 50,
      y: height - yPosition,
      size: 10,
      color: black,
    })
    page.drawText(alunoData.turmaName, {
      x: 320,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // Data de Inscrição
    yPosition += 18
    page.drawText("Data de Inscrição", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    page.drawText(new Date(alunoData.createdAt).toLocaleDateString("pt-AO"), {
      x: 50,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // Linha separadora
    yPosition += 18
    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 2,
      color: darkBlue,
    })

    // INFORMAÇÕES DE PAGAMENTO
    yPosition += 25
    page.drawText("INFORMAÇÕES DE PAGAMENTO", {
      x: 50,
      y: height - yPosition,
      size: 14,
      color: darkBlue,
    })

    // Método de Pagamento e Prestações Pagas (lado a lado)
    yPosition += 20
    
    // Coluna 1: Método de Pagamento
    page.drawText("Método de Pagamento", {
      x: 50,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })
    
    // Coluna 2: Prestações Pagas
    page.drawText("Prestações Pagas", {
      x: 320,
      y: height - yPosition,
      size: 9,
      color: darkGray,
    })

    yPosition += 12
    
    // Valor do método de pagamento
    page.drawText(alunoData.paymentMethod || "Não informado", {
      x: 50,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // Calcular porcentagem de prestações
    const installmentPercentage = alunoData.installmentsPaid && alunoData.totalInstallments
      ? Math.round((alunoData.installmentsPaid / alunoData.totalInstallments) * 100)
      : 0
    const installmentsText = alunoData.installmentsPaid && alunoData.totalInstallments
      ? `${installmentPercentage}%`
      : "Sem informação"
    
    // Valor da porcentagem de prestações
    page.drawText(installmentsText, {
      x: 320,
      y: height - yPosition,
      size: 10,
      color: black,
    })

    // Rodapé centralizado no fundo da página (posição fixa)
    const footerText = "Este documento foi gerado automaticamente pelo sistema Treinix"
    const footerSize = 8
    // Calcular posição centralizada na largura da página
    const estimatedCharWidth = footerText.length * (footerSize * 0.4) // Aproximação
    const footerX = (width - estimatedCharWidth) / 2
    const footerY = 35 // 35 pontos do fundo da página

    page.drawText(footerText, {
      x: footerX,
      y: footerY,
      size: footerSize,
      color: darkGray,
    })

    // Telefone do sistema abaixo
    if (alunoData.systemPhone) {
      const phoneText = alunoData.systemPhone
      const phoneCharWidth = phoneText.length * (footerSize * 0.4)
      const phoneX = (width - phoneCharWidth) / 2
      
      page.drawText(phoneText, {
        x: phoneX,
        y: footerY - 12,
        size: footerSize,
        color: darkGray,
      })
    }

    // Salvar PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Ficha_${alunoData.name.replace(/\s+/g, "_")}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw error
  }
}

export async function generatePDF(
  titulo: string,
  dados: Array<{ [key: string]: string }>,
  totais?: { 
    totalCobrado?: number
    totalRecebido?: number
    totalParcial?: number
    totalPendente?: number
    formatCurrency?: (value: number) => string
    centroData?: { nome: string; email: string; telefone: string; endereco: string; nif?: string }
  }
) {
  try {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    const darkBlue = rgb(30 / 255, 58 / 255, 138 / 255) // #1e3a8a
    const orange = rgb(249 / 255, 115 / 255, 22 / 255) // #f97316
    const darkGray = rgb(50 / 255, 50 / 255, 50 / 255)
    const mediumGray = rgb(100 / 255, 100 / 255, 100 / 255)
    const lightGray = rgb(240 / 255, 240 / 255, 240 / 255)
    const white = rgb(1, 1, 1)
    const black = rgb(0, 0, 0)

    const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold")
    const helvetica = await pdfDoc.embedFont("Helvetica")

    let yPosition = 40

    // ===== CABEÇALHO FORMAL COM DADOS DO CENTRO =====
    // Dados do Centro
    if (totais?.centroData) {
      const centro = totais.centroData
      
      // Nome do Centro - em destaque
      page.drawText((centro.nome || "Centro de Formação").toUpperCase(), {
        x: 40,
        y: height - yPosition,
        size: 16,
        color: darkBlue,
        font: helveticaBold,
      })
      yPosition += 18

      // Informações de contato - bem formatadas
      if (centro.email) {
        page.drawText(`Email: ${centro.email}`, {
          x: 40,
          y: height - yPosition,
          size: 10,
          color: darkGray,
          font: helvetica,
        })
        yPosition += 12
      }

      if (centro.telefone) {
        page.drawText(`Telefone: ${centro.telefone}`, {
          x: 40,
          y: height - yPosition,
          size: 10,
          color: darkGray,
          font: helvetica,
        })
        yPosition += 12
      }

      if (centro.endereco) {
        page.drawText(`Localização: ${centro.endereco}`, {
          x: 40,
          y: height - yPosition,
          size: 10,
          color: darkGray,
          font: helvetica,
        })
        yPosition += 12
      }

      if (centro.nif) {
        page.drawText(`NIF: ${centro.nif}`, {
          x: 40,
          y: height - yPosition,
          size: 10,
          color: darkGray,
          font: helvetica,
        })
        yPosition += 12
      }

      yPosition += 8
    }

    // ===== RESUMO FINANCEIRO =====
    if (totais && totais.formatCurrency) {
      const formatCurrency = totais.formatCurrency

      // Título
      page.drawText("RESUMO FINANCEIRO", {
        x: 40,
        y: height - yPosition,
        size: 12,
        color: darkBlue,
        font: helveticaBold,
      })
      yPosition += 20

      // Layout 2x2 com caixas colorizadas
      const boxWidth = (width - 80) / 2 - 8
      const boxHeight = 50
      const greenColor = rgb(16/255, 185/255, 129/255) // #10b981
      const blueColor = rgb(59/255, 130/255, 246/255) // #3b82f6
      const purpleColor = rgb(139/255, 92/255, 246/255) // #8b5cf6
      const orangeColor = rgb(249/255, 115/255, 22/255) // #f97316

      const items = [
        { label: "Total Cobrado", value: totais.totalCobrado || 0, color: greenColor },
        { label: "Já Recebido", value: totais.totalRecebido || 0, color: blueColor },
        { label: "Recebido Parcial", value: totais.totalParcial || 0, color: purpleColor },
        { label: "A Receber", value: totais.totalPendente || 0, color: orangeColor },
      ]

      let boxIndex = 0
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const xBox = 40 + j * (boxWidth + 16)
          const yBox = height - yPosition - i * (boxHeight + 12)
          const item = items[boxIndex]

          // Caixa de fundo com cor
          page.drawRectangle({
            x: xBox,
            y: yBox - boxHeight,
            width: boxWidth,
            height: boxHeight,
            color: item.color,
            opacity: 0.15,
          })

          // Borda
          page.drawRectangle({
            x: xBox,
            y: yBox - boxHeight,
            width: boxWidth,
            height: boxHeight,
            borderColor: item.color,
            borderWidth: 1.5,
          })

          // Label
          page.drawText(item.label, {
            x: xBox + 8,
            y: yBox - 18,
            size: 9,
            color: item.color,
            font: helveticaBold,
          })

          // Valor
          page.drawText(formatCurrency(item.value), {
            x: xBox + 8,
            y: yBox - 35,
            size: 13,
            color: darkBlue,
            font: helveticaBold,
          })

          boxIndex++
        }
      }

      yPosition += 130
    }

    // ===== TABELA DE DETALHAMENTO =====
    page.drawText("DETALHAMENTO DE PAGAMENTOS", {
      x: 40,
      y: height - yPosition,
      size: 11,
      color: darkBlue,
      font: helveticaBold,
    })
    yPosition += 18

    // Cabeçalhos da tabela
    const colunas = Object.keys(dados[0] || {})
    const colunasAbreviadas = {
      aluno: "Aluno",
      formacao: "Formação",
      turma: "Turma",
      valor: "Valor",
      parcelas: "Parc.",
      metodo: "Método",
      data: "Data",
      status: "Status",
    }

    const larguraColuna = (width - 80) / colunas.length

    // Background para cabeçalhos
    page.drawRectangle({
      x: 40,
      y: height - yPosition - 12,
      width: width - 80,
      height: 15,
      color: darkBlue,
    })

    let xCol = 50
    colunas.forEach((col) => {
      const colLabel = (colunasAbreviadas as { [key: string]: string })[col] || col
      page.drawText(colLabel, {
        x: xCol,
        y: height - yPosition - 10,
        size: 8,
        color: white,
        font: helveticaBold,
      })
      xCol += larguraColuna
    })

    yPosition += 20

    // Linhas de dados
    let linhasNaPagina = 0
    const linhasMaximasPorPagina = 35

    dados.forEach((row, indexRow) => {
      // Verificar se precisa de nova página
      if (linhasNaPagina >= linhasMaximasPorPagina) {
        page = pdfDoc.addPage([595, 842])
        yPosition = 40
        linhasNaPagina = 0

        // Repetir cabeçalhos na nova página
        page.drawRectangle({
          x: 40,
          y: height - yPosition - 12,
          width: width - 80,
          height: 15,
          color: darkBlue,
        })

        let xHeaderCol = 50
        colunas.forEach((col) => {
          const colLabel = (colunasAbreviadas as { [key: string]: string })[col] || col
          page.drawText(colLabel, {
            x: xHeaderCol,
            y: height - yPosition - 10,
            size: 8,
            color: white,
            font: helveticaBold,
          })
          xHeaderCol += larguraColuna
        })

        yPosition += 20
      }

      // Cores alternadas para linhas
      if (linhasNaPagina % 2 === 0) {
        page.drawRectangle({
          x: 40,
          y: height - yPosition - 10,
          width: width - 80,
          height: 12,
          color: lightGray,
        })
      }

      // Dados da linha
      xCol = 50
      colunas.forEach((col) => {
        const texto = String(row[col] || "")
        const textoTruncado = texto.length > 12 ? texto.substring(0, 10) + "..." : texto

        page.drawText(textoTruncado, {
          x: xCol,
          y: height - yPosition - 8,
          size: 8,
          color: black,
        })
        xCol += larguraColuna
      })

      yPosition += 12
      linhasNaPagina += 1
    })

    // ===== RODAPÉ =====
    const footerY = 20
    const separadorY = 30

    // Linha separadora no rodapé
    page.drawRectangle({
      x: 40,
      y: footerY + separadorY,
      width: width - 80,
      height: 1,
      color: mediumGray,
    })

    // Data e hora de geração
    const dataAtual = new Date().toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const horaAtual = new Date().toLocaleTimeString("pt-AO", {
      hour: "2-digit",
      minute: "2-digit",
    })

    // Texto do rodapé - Data/Hora à esquerda
    page.drawText(`Gerado em: ${dataAtual} às ${horaAtual}`, {
      x: 40,
      y: footerY + 15,
      size: 7,
      color: mediumGray,
    })

    // Sistema ao centro
    const footerText = "Treinix - Sistema de Gestão de Centros de Formação"
    const footerSize = 7
    const estimatedCharWidth = footerText.length * (footerSize * 0.4)
    const footerX = (width - estimatedCharWidth) / 2

    page.drawText(footerText, {
      x: footerX,
      y: footerY + 15,
      size: footerSize,
      color: mediumGray,
    })

    // Página à direita
    page.drawText(`Página ${pdfDoc.getPages().length}`, {
      x: width - 80,
      y: footerY + 15,
      size: footerSize,
      color: mediumGray,
    })

    // Salvar PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Relatorio_Pagamentos_${dataAtual.replace(/\//g, "-")}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Erro ao gerar PDF de relatório:", error)
    throw error
  }
}
