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
