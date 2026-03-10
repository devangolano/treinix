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