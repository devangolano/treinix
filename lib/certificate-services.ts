import { supabase } from "./supabase"
import {
  CertificateTemplate,
  Certificate,
  CertificateLog,
} from "./types"

// ============================================
// SERVIÇOS DE MODELOS DE CERTIFICADOS
// ============================================

/**
 * Obter todos os modelos de certificados de um centro
 */
export async function getCertificateTemplates(
  centroId: string
): Promise<CertificateTemplate[]> {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("centro_id", centroId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar modelos de certificados:", error)
    throw error
  }
}

/**
 * Obter um modelo de certificado específico
 */
export async function getCertificateTemplate(
  templateId: string
): Promise<CertificateTemplate | null> {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data
  } catch (error) {
    console.error("Erro ao buscar modelo de certificado:", error)
    throw error
  }
}

/**
 * Criar um novo modelo de certificado
 */
export async function createCertificateTemplate(
  centroId: string,
  template: {
    name: string
    description?: string
    pdfUrl: string
    filePath: string
  }
): Promise<CertificateTemplate> {
  try {
    const { data, error } = await supabase
      .from("certificate_templates")
      .insert({
        centro_id: centroId,
        name: template.name,
        description: template.description,
        pdf_url: template.pdfUrl,
        file_path: template.filePath,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao criar modelo de certificado:", error)
    throw error
  }
}

/**
 * Atualizar um modelo de certificado
 */
export async function updateCertificateTemplate(
  templateId: string,
  updates: Partial<{
    name: string
    description: string
    pdfUrl: string
    filePath: string
    isActive: boolean
  }>
): Promise<CertificateTemplate> {
  try {
    const updateData: Record<string, any> = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.pdfUrl !== undefined) updateData.pdf_url = updates.pdfUrl
    if (updates.filePath !== undefined) updateData.file_path = updates.filePath
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { data, error } = await supabase
      .from("certificate_templates")
      .update(updateData)
      .eq("id", templateId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao atualizar modelo de certificado:", error)
    throw error
  }
}

/**
 * Deletar um modelo de certificado
 */
export async function deleteCertificateTemplate(
  templateId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("certificate_templates")
      .delete()
      .eq("id", templateId)

    if (error) throw error
  } catch (error) {
    console.error("Erro ao deletar modelo de certificado:", error)
    throw error
  }
}

// ============================================
// SERVIÇOS DE CERTIFICADOS
// ============================================

/**
 * Obter todos os certificados de um centro
 */
export async function getCertificates(centroId: string): Promise<Certificate[]> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("centro_id", centroId)
      .order("issue_date", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar certificados:", error)
    throw error
  }
}

/**
 * Obter certificados por turma
 */
export async function getCertificatesByTurma(turmaId: string): Promise<Certificate[]> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("turma_id", turmaId)
      .eq("status", "issued")
      .order("issue_date", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar certificados da turma:", error)
    throw error
  }
}

/**
 * Obter certificado de um aluno em uma turma
 */
export async function getCertificateByAlunoAndTurma(
  alunoId: string,
  turmaId: string
): Promise<Certificate | null> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("aluno_id", alunoId)
      .eq("turma_id", turmaId)
      .eq("status", "issued")
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data
  } catch (error) {
    console.error("Erro ao buscar certificado do aluno:", error)
    throw error
  }
}

/**
 * Obter resumo de certificados por turma
 */
export async function getCertificatesSummaryByTurma(
  centroId: string
): Promise<
  Array<{
    turmaId: string
    turmaName: string
    formacaoName: string
    totalAlunos: number
    certificadosEmitidos: number
    alunosSemCertificado: number
  }>
> {
  try {
    const { data, error } = await supabase
      .from("certificates_summary_by_turma")
      .select("*")
      .eq("centro_name", (await supabase
        .from("centros")
        .select("name")
        .eq("id", centroId)
        .single()
      ).data?.name)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar resumo de certificados:", error)
    throw error
  }
}

/**
 * Gerar número único de certificado
 */
export function generateCertificateNumber(
  centroId: string,
  turmaId: string,
  timestamp: Date = new Date()
): string {
  const year = timestamp.getFullYear()
  const month = String(timestamp.getMonth() + 1).padStart(2, "0")
  const day = String(timestamp.getDate()).padStart(2, "0")
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()

  return `CERT-${centroId.substring(0, 4)}-${year}${month}${day}-${random}`
}

/**
 * Emitir um novo certificado
 */
export async function issueCertificate(
  centroId: string,
  alunoId: string,
  turmaId: string,
  templateId: string,
  issuedBy: string,
  options?: {
    pdfUrl?: string
    filePath?: string
    issueDate?: Date
  }
): Promise<Certificate> {
  try {
    const certificateNumber = generateCertificateNumber(
      centroId,
      turmaId,
      options?.issueDate
    )

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        centro_id: centroId,
        aluno_id: alunoId,
        turma_id: turmaId,
        template_id: templateId,
        certificate_number: certificateNumber,
        pdf_url: options?.pdfUrl,
        file_path: options?.filePath,
        issue_date: options?.issueDate || new Date(),
        issued_by: issuedBy,
        status: "issued",
      })
      .select()
      .single()

    if (error) throw error

    // Registrar no log
    if (data) {
      await logCertificateAction(
        data.id,
        "issued",
        issuedBy,
        { templateId, turmaId }
      )
    }

    return data
  } catch (error) {
    console.error("Erro ao emitir certificado:", error)
    throw error
  }
}

/**
 * Revogar um certificado
 */
export async function revokeCertificate(
  certificateId: string,
  revokeReason: string,
  revokedBy: string
): Promise<Certificate> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .update({
        status: "revoked",
        revoked_at: new Date(),
        revoke_reason: revokeReason,
      })
      .eq("id", certificateId)
      .select()
      .single()

    if (error) throw error

    // Registrar no log
    if (data) {
      await logCertificateAction(
        certificateId,
        "revoked",
        revokedBy,
        { reason: revokeReason }
      )
    }

    return data
  } catch (error) {
    console.error("Erro ao revogar certificado:", error)
    throw error
  }
}

// ============================================
// SERVIÇOS DE LOGS
// ============================================

/**
 * Registrar ação de certificado
 */
export async function logCertificateAction(
  certificateId: string,
  action: "issued" | "revoked" | "regenerated" | "viewed",
  actionBy: string,
  details?: Record<string, any>
): Promise<CertificateLog> {
  try {
    const { data, error } = await supabase
      .from("certificate_logs")
      .insert({
        certificate_id: certificateId,
        action,
        action_by: actionBy,
        action_date: new Date(),
        details,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Erro ao registrar ação de certificado:", error)
    throw error
  }
}

/**
 * Obter logs de um certificado
 */
export async function getCertificateLogs(
  certificateId: string
): Promise<CertificateLog[]> {
  try {
    const { data, error } = await supabase
      .from("certificate_logs")
      .select("*")
      .eq("certificate_id", certificateId)
      .order("action_date", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Erro ao buscar logs de certificado:", error)
    throw error
  }
}
