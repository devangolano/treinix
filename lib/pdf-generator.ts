import { PDFDocument, rgb } from "pdf-lib"

interface AlunoFichaData {
  name: string
  email: string
  phone: string
  bi: string
  birthDate: Date | string
  address: string
  status: string
  createdAt: Date | string
  centroName?: string
  centroEmail?: string
  centroPhone?: string
  centroAddress?: string
  centroLogoUrl?: string
  formacao?: string
  turma?: string
  paymentMethod?: string
  paymentStatus?: "paid" | "half-paid" | "pending"
  installmentsPaid?: number
  totalInstallments?: number
  systemPhone?: string
}

export async function generateAlunoPDF(alunoData: AlunoFichaData) {

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])

  const { width, height } = page.getSize()

  const helvetica = await pdfDoc.embedFont("Helvetica")
  const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold")

  const darkBlue = rgb(30/255,58/255,138/255)
  const mediumGray = rgb(107/255,114/255,128/255)
  const darkText = rgb(30/255,30/255,30/255)
  const borderColor = rgb(220/255,220/255,220/255)
  const green = rgb(22/255,101/255,52/255)
  const red = rgb(153/255,27/255,27/255)

  let yPos = 60
  let logoWidth = 0

  /* ===============================
     LOGO DO CENTRO
  =============================== */

  if (alunoData.centroLogoUrl) {

    try {

      const res = await fetch(alunoData.centroLogoUrl)
      const imageBytes = await res.arrayBuffer()

      let logoImage

      if (alunoData.centroLogoUrl.endsWith(".png")) {
        logoImage = await pdfDoc.embedPng(imageBytes)
      } else {
        logoImage = await pdfDoc.embedJpg(imageBytes)
      }

      const maxWidth = 70
      const maxHeight = 50

      const imgWidth = logoImage.width
      const imgHeight = logoImage.height

      let finalWidth = maxWidth
      let finalHeight = (imgHeight / imgWidth) * finalWidth

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight
        finalWidth = (imgWidth / imgHeight) * finalHeight
      }

      logoWidth = finalWidth

      page.drawImage(logoImage,{
        x:50,
        y:height-90,
        width:finalWidth,
        height:finalHeight
      })

    } catch (err) {

      console.log("Erro ao carregar logo:", err)

    }

  }

  /* ===============================
     CABEÇALHO
  =============================== */

  const headerStartX = 60 + logoWidth

  page.drawText(alunoData.centroName || "Centro de Formação", {
    x: headerStartX,
    y: height - 55,
    size: 16,
    color: darkBlue,
    font: helveticaBold
  })

  let infoY = 70

  if (alunoData.centroEmail) {

    page.drawText(`Email: ${alunoData.centroEmail}`, {
      x: headerStartX,
      y: height - infoY,
      size: 10,
      color: darkText,
      font: helvetica
    })

    infoY += 12
  }

  if (alunoData.centroPhone) {

    page.drawText(`Telefone: ${alunoData.centroPhone}`, {
      x: headerStartX,
      y: height - infoY,
      size: 10,
      color: darkText,
      font: helvetica
    })

    infoY += 12
  }

  if (alunoData.centroAddress) {

    page.drawText(`Localização: ${alunoData.centroAddress}`, {
      x: headerStartX,
      y: height - infoY,
      size: 10,
      color: darkText,
      font: helvetica
    })

  }

  yPos = infoY + 20

  page.drawLine({
    start:{x:50,y:height-yPos},
    end:{x:width-50,y:height-yPos},
    thickness:2,
    color:darkBlue
  })

  yPos += 30

  /* ===============================
     TITULO
  =============================== */

  page.drawText("FICHA DO ALUNO",{
    x: width/2 - 80,
    y: height - yPos,
    size:18,
    font: helveticaBold,
    color:darkBlue
  })

  yPos += 35

  /* ===============================
     FUNÇÕES DE LAYOUT
  =============================== */

  function sectionTitle(title:string){

    page.drawRectangle({
      x:50,
      y:height-yPos+2,
      width:4,
      height:14,
      color:darkBlue
    })

    page.drawText(title,{
      x:60,
      y:height-yPos,
      size:12,
      font:helveticaBold,
      color:darkBlue
    })

    yPos+=20
  }

  function row(label:string,value:string){

    page.drawText(label,{
      x:60,
      y:height-yPos,
      size:9,
      color:mediumGray,
      font:helveticaBold
    })

    page.drawText(value || "—",{
      x:220,
      y:height-yPos,
      size:10,
      color:darkText,
      font:helvetica
    })

    page.drawLine({
      start:{x:50,y:height-yPos-6},
      end:{x:width-50,y:height-yPos-6},
      thickness:0.5,
      color:borderColor
    })

    yPos+=18
  }

  /* ===============================
     INFORMAÇÕES PESSOAIS
  =============================== */

  sectionTitle("INFORMAÇÕES PESSOAIS")

  row("Nome Completo", alunoData.name)
  row("Email", alunoData.email)
  row("Telefone", alunoData.phone)
  row("Documento de Identidade", alunoData.bi)

  row(
    "Data de Nascimento",
    new Date(alunoData.birthDate).toLocaleDateString("pt-AO")
  )

  row("Endereço", alunoData.address)

  yPos += 10

  /* ===============================
     INFORMAÇÕES ACADÉMICAS
  =============================== */

  sectionTitle("INFORMAÇÕES ACADÉMICAS")

  row("Formação", alunoData.formacao || "Não informado")
  row("Turma", alunoData.turma || "Não informado")

  row(
    "Data de Matrícula",
    new Date(alunoData.createdAt).toLocaleDateString("pt-AO")
  )

  yPos += 10

  /* ===============================
     PAGAMENTO
  =============================== */

  sectionTitle("INFORMAÇÕES DE PAGAMENTO")

  row("Método de Pagamento", alunoData.paymentMethod || "Não informado")

  const statusText =
    alunoData.paymentStatus === "paid"
      ? "PAGO"
      : alunoData.paymentStatus === "pending"
      ? "PENDENTE"
      : "EM PROCESSO"

  const statusColor =
    alunoData.paymentStatus === "paid"
      ? green
      : alunoData.paymentStatus === "pending"
      ? red
      : mediumGray

  page.drawText("Estado",{
    x:60,
    y:height-yPos,
    size:9,
    font:helveticaBold,
    color:mediumGray
  })

  page.drawRectangle({
    x:220,
    y:height-yPos-4,
    width:90,
    height:14,
    color:statusColor,
    opacity:0.15
  })

  page.drawText(statusText,{
    x:230,
    y:height-yPos,
    size:10,
    font:helveticaBold,
    color:statusColor
  })

  yPos += 22

  const percent =
    alunoData.installmentsPaid && alunoData.totalInstallments
      ? Math.round(
          (alunoData.installmentsPaid /
            alunoData.totalInstallments) * 100
        )
      : 0

  row("Percentagem Paga", `${percent}%`)

  /* ===============================
     RODAPÉ
  =============================== */

  const today = new Date().toLocaleDateString("pt-AO")

  page.drawLine({
    start:{x:50,y:40},
    end:{x:width-50,y:40},
    thickness:1,
    color:borderColor
  })

  page.drawText(
    "Documento gerado automaticamente pelo sistema treinix.vercel.app",
    {
      x: width/2 - 160,
      y: 25,
      size:8,
      color:mediumGray,
      font:helvetica
    }
  )

  page.drawText(`Emitido em ${today}`,{
    x: width-150,
    y: 25,
    size:8,
    color:mediumGray,
    font:helvetica
  })

  /* ===============================
     DOWNLOAD
  =============================== */

  const pdfBytes = await pdfDoc.save()

  const blob = new Blob([pdfBytes as BufferSource], {
    type:"application/pdf"
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")

  link.href = url
  link.download = `Ficha_${alunoData.name.replace(/\s+/g,"_")}.pdf`

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)

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
    centroData?: { nome: string; email: string; telefone: string; endereco: string; nif?: string; logoUrl?: string }
  }
) {
  try {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold")
    const helvetica = await pdfDoc.embedFont("Helvetica")

    const darkBlue = rgb(30 / 255, 58 / 255, 138 / 255)
    const mediumGray = rgb(107 / 255, 114 / 255, 128 / 255)
    const darkText = rgb(30 / 255, 30 / 255, 30 / 255)
    const borderColor = rgb(220 / 255, 220 / 255, 220 / 255)
    const darkGray = rgb(50 / 255, 50 / 255, 50 / 255)
    const lightGray = rgb(240 / 255, 240 / 255, 240 / 255)
    const white = rgb(1, 1, 1)
    const black = rgb(0, 0, 0)

    let yPosition = 60

    // ===== CABEÇALHO =====
    let logoWidth = 0

    if (totais?.centroData?.logoUrl) {
      try {
        const logoResponse = await fetch(totais.centroData.logoUrl)
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer()

          const logoImage = totais.centroData.logoUrl.toLowerCase().includes('jpg') || totais.centroData.logoUrl.toLowerCase().includes('jpeg')
            ? await pdfDoc.embedJpg(logoBuffer)
            : await pdfDoc.embedPng(logoBuffer)

          const logoMaxHeight = 40
          const scaleFactor = logoMaxHeight / logoImage.height
          logoWidth = logoImage.width * scaleFactor

          if (logoWidth > 60) {
            logoWidth = 60
            const newHeight = (logoImage.height * logoWidth) / logoImage.width
            page.drawImage(logoImage, {
              x: 50,
              y: height - yPosition - newHeight,
              width: logoWidth,
              height: newHeight,
            })
          } else {
            page.drawImage(logoImage, {
              x: 50,
              y: height - yPosition - logoMaxHeight,
              width: logoWidth,
              height: logoMaxHeight,
            })
          }
        }
      } catch (error) {
        console.error("Erro ao carregar logo:", error)
      }
    }

    const headerStartX = 50 + logoWidth + (logoWidth > 0 ? 15 : 0)

    if (totais?.centroData) {
      const centro = totais.centroData

      page.drawText((centro.nome || "Centro de Formação").toUpperCase(), {
        x: headerStartX,
        y: height - yPosition,
        size: 16,
        color: darkBlue,
        font: helveticaBold,
      })
      yPosition += 18

      if (centro.email) {
        page.drawText(`Email: ${centro.email}`, {
          x: headerStartX,
          y: height - yPosition,
          size: 10,
          color: darkText,
          font: helvetica,
        })
        yPosition += 12
      }

      if (centro.telefone) {
        page.drawText(`Telefone: ${centro.telefone}`, {
          x: headerStartX,
          y: height - yPosition,
          size: 10,
          color: darkText,
          font: helvetica,
        })
        yPosition += 12
      }

      if (centro.endereco) {
        page.drawText(`Localização: ${centro.endereco}`, {
          x: headerStartX,
          y: height - yPosition,
          size: 10,
          color: darkText,
          font: helvetica,
        })
        yPosition += 12
      }

      if (centro.nif) {
        page.drawText(`NIF: ${centro.nif}`, {
          x: headerStartX,
          y: height - yPosition,
          size: 10,
          color: darkText,
          font: helvetica,
        })
        yPosition += 12
      }
    }

    yPosition += 15

    // Linha separadora
    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 2,
      color: darkBlue,
    })

    yPosition += 20

    // Título do relatório
    page.drawText(titulo.toUpperCase(), {
      x: 50,
      y: height - yPosition,
      size: 14,
      color: darkBlue,
      font: helveticaBold,
    })

    const today = new Date().toLocaleDateString("pt-AO")
    page.drawText(`Data: ${today}`, {
      x: width - 120,
      y: height - yPosition,
      size: 11,
      color: darkBlue,
    })

    yPosition += 25

    // ===== RESUMO FINANCEIRO =====
    if (totais && totais.formatCurrency) {
      const formatCurrency = totais.formatCurrency

      page.drawText("RESUMO FINANCEIRO", {
        x: 50,
        y: height - yPosition,
        size: 12,
        color: darkBlue,
        font: helveticaBold,
      })

      yPosition += 18

      const col1X = 55
      const col2X = 300

      // Linha 1: Total Cobrado e Já Recebido
      page.drawText("Total Cobrado", {
        x: col1X,
        y: height - yPosition,
        size: 8,
        color: mediumGray,
      })
      page.drawText("Ja Recebido", {
        x: col2X,
        y: height - yPosition,
        size: 8,
        color: mediumGray,
      })

      page.drawText(formatCurrency(totais.totalCobrado || 0), {
        x: col1X,
        y: height - yPosition - 10,
        size: 11,
        color: darkText,
        font: helveticaBold,
      })
      page.drawText(formatCurrency(totais.totalRecebido || 0), {
        x: col2X,
        y: height - yPosition - 10,
        size: 11,
        color: darkText,
        font: helveticaBold,
      })

      yPosition += 22

      // Linha 2: Parcial e Pendente
      page.drawText("Parcial", {
        x: col1X,
        y: height - yPosition,
        size: 8,
        color: mediumGray,
      })
      page.drawText("A Receber", {
        x: col2X,
        y: height - yPosition,
        size: 8,
        color: mediumGray,
      })

      page.drawText(formatCurrency(totais.totalParcial || 0), {
        x: col1X,
        y: height - yPosition - 10,
        size: 11,
        color: darkText,
        font: helveticaBold,
      })
      page.drawText(formatCurrency(totais.totalPendente || 0), {
        x: col2X,
        y: height - yPosition - 10,
        size: 11,
        color: darkText,
        font: helveticaBold,
      })

      yPosition += 25
    }

    // ===== TABELA DE DETALHAMENTO =====

    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 1,
      color: borderColor,
    })

    yPosition += 15

    page.drawText("DETALHAMENTO DE PAGAMENTOS", {
      x: 50,
      y: height - yPosition,
      size: 12,
      color: darkBlue,
      font: helveticaBold,
    })

    yPosition += 18

    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 1,
      color: borderColor,
    })

    yPosition += 10

    // Cabeçalhos da tabela
    const colunas = Object.keys(dados[0] || {})
    const colunasAbreviadas: { [key: string]: string } = {
      aluno: "Aluno",
      formacao: "Formação",
      turma: "Turma",
      valor: "Valor",
      parcelas: "Parc.",
      metodo: "Método",
      data: "Data",
      status: "Status",
    }

    const larguraColuna = (width - 100) / colunas.length

    let xCol = 55
    colunas.forEach((col) => {
      const colLabel = colunasAbreviadas[col] || col
      page.drawText(colLabel, {
        x: xCol,
        y: height - yPosition,
        size: 9,
        color: darkBlue,
        font: helveticaBold,
      })
      xCol += larguraColuna
    })

    yPosition += 12

    page.drawLine({
      start: { x: 50, y: height - yPosition },
      end: { x: width - 50, y: height - yPosition },
      thickness: 0.5,
      color: borderColor,
    })

    yPosition += 8

    // Linhas de dados
    let linhasNaPagina = 0
    const linhasMaximasPorPagina = 30

    dados.forEach((row, indexRow) => {
      // Nova página se necessário
      if (linhasNaPagina >= linhasMaximasPorPagina) {
        page = pdfDoc.addPage([595, 842])
        yPosition = 40
        linhasNaPagina = 0

        // Repetir cabeçalho em nova página
        page.drawText(titulo.toUpperCase(), {
          x: 50,
          y: height - yPosition,
          size: 12,
          color: darkBlue,
          font: helveticaBold,
        })

        yPosition += 20

        page.drawLine({
          start: { x: 50, y: height - yPosition },
          end: { x: width - 50, y: height - yPosition },
          thickness: 1,
          color: borderColor,
        })

        yPosition += 10

        xCol = 55
        colunas.forEach((col) => {
          const colLabel = colunasAbreviadas[col] || col
          page.drawText(colLabel, {
            x: xCol,
            y: height - yPosition,
            size: 9,
            color: darkBlue,
            font: helveticaBold,
          })
          xCol += larguraColuna
        })

        yPosition += 12

        page.drawLine({
          start: { x: 50, y: height - yPosition },
          end: { x: width - 50, y: height - yPosition },
          thickness: 0.5,
          color: borderColor,
        })

        yPosition += 8
      }

      // Cores alternadas
      if (linhasNaPagina % 2 === 0) {
        page.drawRectangle({
          x: 50,
          y: height - yPosition - 10,
          width: width - 100,
          height: 12,
          color: lightGray,
        })
      }

      xCol = 55
      colunas.forEach((col) => {
        const texto = String(row[col] || "")
        const textoTruncado = texto.length > 15 ? texto.substring(0, 13) + ".." : texto

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
    const footerY = 30

    page.drawLine({
      start: { x: 50, y: footerY + 15 },
      end: { x: width - 50, y: footerY + 15 },
      thickness: 1,
      color: borderColor,
    })

    page.drawText("Documento gerado automaticamente pelo sistema Treinix", {
      x: 50,
      y: footerY + 5,
      size: 7,
      color: mediumGray,
    })

    page.drawText(`Data: ${today}`, {
      x: width - 120,
      y: footerY + 5,
      size: 7,
      color: mediumGray,
    })

    // Salvar PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes as BufferSource], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${titulo.replace(/\s+/g, "_")}_${today.replace(/\//g, "-")}.pdf`
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