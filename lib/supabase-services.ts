import { supabase } from "./supabase"
import type { Centro, Subscription, Formacao, Aluno, Turma, Pagamento, PagamentoInstallment } from "./types"

// ============================================
// SERVIÇO DE CENTROS
// ============================================
export const centroService = {
  /**
   * Obtém todos os centros
   * Apenas super admin pode acessar
   */
  async getAll(): Promise<Centro[]> {
    try {
      const { data, error } = await supabase.from("centros").select("*").order("created_at", {
        ascending: false,
      })

      if (error) throw error

      return (data || []).map((centro) => ({
        ...centro,
        id: centro.id,
        name: centro.name,
        email: centro.email,
        phone: centro.phone,
        address: centro.address,
        nif: centro.nif,
        createdAt: new Date(centro.created_at),
        subscriptionStatus: centro.subscription_status,
        trialEndsAt: centro.trial_ends_at ? new Date(centro.trial_ends_at) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar centros:", error)
      return []
    }
  },

  /**
   * Obtém um centro pelo ID
   */
  async getById(id: string): Promise<Centro | null> {
    try {
      const { data, error } = await supabase.from("centros").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        createdAt: new Date(data.created_at),
        subscriptionStatus: data.subscription_status,
        trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
      }
    } catch (error) {
      console.error("Erro ao buscar centro:", error)
      return null
    }
  },

  /**
   * Cria um novo centro
   */
  async create(
    data: Omit<Centro, "id" | "createdAt" | "subscriptionStatus" | "trialEndsAt">
  ): Promise<Centro | null> {
    try {
      const { data: newCentro, error } = await supabase.from("centros").insert([
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          nif: data.nif,
          subscription_status: "trial",
          trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      ]).select().single()

      if (error) throw error

      return {
        ...newCentro,
        createdAt: new Date(newCentro.created_at),
        subscriptionStatus: newCentro.subscription_status,
        trialEndsAt: newCentro.trial_ends_at ? new Date(newCentro.trial_ends_at) : undefined,
      }
    } catch (error) {
      console.error("Erro ao criar centro:", error)
      return null
    }
  },

  /**
   * Atualiza um centro
   */
  async update(id: string, data: Partial<Centro>): Promise<Centro | null> {
    try {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.email) updateData.email = data.email
      if (data.phone) updateData.phone = data.phone
      if (data.address) updateData.address = data.address
      if (data.nif) updateData.nif = data.nif
      if (data.subscriptionStatus) updateData.subscription_status = data.subscriptionStatus

      const { data: updatedCentro, error } = await supabase
        .from("centros")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        ...updatedCentro,
        createdAt: new Date(updatedCentro.created_at),
        subscriptionStatus: updatedCentro.subscription_status,
        trialEndsAt: updatedCentro.trial_ends_at ? new Date(updatedCentro.trial_ends_at) : undefined,
      }
    } catch (error) {
      console.error("Erro ao atualizar centro:", error)
      return null
    }
  },

  /**
   * Deleta um centro
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("centros").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao deletar centro:", error)
      return false
    }
  },
}

// ============================================
// SERVIÇO DE SUBSCRIÇÕES
// ============================================
export const subscriptionService = {
  /**
   * Obtém todas as subscrições de um centro
   */
  async getByCentroId(centroId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("centro_id", centroId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((sub) => ({
        ...sub,
        centroId: sub.centro_id,
        startDate: new Date(sub.start_date),
        endDate: new Date(sub.end_date),
        paymentStatus: sub.payment_status,
        createdAt: new Date(sub.created_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar subscrições:", error)
      return []
    }
  },

  /**
   * Cria uma nova subscrição
   */
  async create(data: Omit<Subscription, "id" | "createdAt">): Promise<Subscription | null> {
    try {
      const { data: newSub, error } = await supabase
        .from("subscriptions")
        .insert([
          {
            centro_id: data.centroId,
            plan: data.plan,
            months: data.months,
            status: data.status,
            start_date: data.startDate.toISOString(),
            end_date: data.endDate.toISOString(),
            payment_status: data.paymentStatus,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        ...newSub,
        centroId: newSub.centro_id,
        startDate: new Date(newSub.start_date),
        endDate: new Date(newSub.end_date),
        paymentStatus: newSub.payment_status,
        createdAt: new Date(newSub.created_at),
      }
    } catch (error) {
      console.error("Erro ao criar subscrição:", error)
      return null
    }
  },

  /**
   * Atualiza uma subscrição
   */
  async update(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    try {
      const updateData: any = {}
      if (data.status) updateData.status = data.status
      if (data.paymentStatus) updateData.payment_status = data.paymentStatus

      const { data: updatedSub, error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      // Se a subscrição foi aprovada, atualizar o status do centro para "active"
      if (data.paymentStatus === "approved" && updatedSub) {
        await centroService.update(updatedSub.centro_id, {
          subscriptionStatus: "active",
        })
      }

      return {
        ...updatedSub,
        centroId: updatedSub.centro_id,
        startDate: new Date(updatedSub.start_date),
        endDate: new Date(updatedSub.end_date),
        paymentStatus: updatedSub.payment_status,
        createdAt: new Date(updatedSub.created_at),
      }
    } catch (error) {
      console.error("Erro ao atualizar subscrição:", error)
      return null
    }
  },

  /**
   * Verifica se um centro tem subscrição ativa
   */
  async hasActiveSubscription(centroId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("centro_id", centroId)
        .eq("status", "active")
        .gt("end_date", new Date().toISOString())
        .single()

      if (error && error.code !== "PGRST116") throw error

      return !!data
    } catch (error) {
      console.error("Erro ao verificar subscrição ativa:", error)
      return false
    }
  },
}

// ============================================
// SERVIÇO DE FORMAÇÕES
// ============================================
export const formacaoService = {
  /**
   * Obtém todas as formações de um centro
   */
  async getAll(centroId: string): Promise<Formacao[]> {
    try {
      const { data, error } = await supabase
        .from("formacoes")
        .select("*")
        .eq("centro_id", centroId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((form) => ({
        ...form,
        centroId: form.centro_id,
        createdAt: new Date(form.created_at),
        updatedAt: new Date(form.updated_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar formações:", error)
      return []
    }
  },

  /**
   * Obtém uma formação pelo ID
   */
  async getById(id: string): Promise<Formacao | null> {
    try {
      const { data, error } = await supabase.from("formacoes").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        centroId: data.centro_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error("Erro ao buscar formação:", error)
      return null
    }
  },

  /**
   * Cria uma nova formação
   */
  async create(data: Omit<Formacao, "id" | "createdAt" | "updatedAt">): Promise<Formacao | null> {
    try {
      const { data: newForm, error } = await supabase
        .from("formacoes")
        .insert([
          {
            centro_id: data.centroId,
            name: data.name,
            description: data.description,
            duration: data.duration,
            price: data.price,
            category: data.category,
            status: data.status || "active",
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        ...newForm,
        centroId: newForm.centro_id,
        createdAt: new Date(newForm.created_at),
        updatedAt: new Date(newForm.updated_at),
      }
    } catch (error) {
      console.error("Erro ao criar formação:", error)
      return null
    }
  },

  /**
   * Atualiza uma formação
   */
  async update(id: string, data: Partial<Formacao>): Promise<Formacao | null> {
    try {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.description) updateData.description = data.description
      if (data.duration) updateData.duration = data.duration
      if (data.price) updateData.price = data.price
      if (data.category) updateData.category = data.category
      if (data.status) updateData.status = data.status

      const { data: updatedForm, error } = await supabase
        .from("formacoes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        ...updatedForm,
        centroId: updatedForm.centro_id,
        createdAt: new Date(updatedForm.created_at),
        updatedAt: new Date(updatedForm.updated_at),
      }
    } catch (error) {
      console.error("Erro ao atualizar formação:", error)
      return null
    }
  },

  /**
   * Deleta uma formação
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("formacoes").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao deletar formação:", error)
      return false
    }
  },
}

// ============================================
// SERVIÇO DE TURMAS
// ============================================
export const turmaService = {
  /**
   * Obtém todas as turmas de um centro
   */
  async getAll(centroId: string): Promise<Turma[]> {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq("centro_id", centroId)
        .order("start_date", { ascending: false })

      if (error) throw error

      return (data || []).map((turma) => ({
        ...turma,
        centroId: turma.centro_id,
        formacaoId: turma.formacao_id,
        startDate: new Date(turma.start_date),
        endDate: new Date(turma.end_date),
        maxStudents: turma.max_students,
        currentStudents: turma.current_students,
        createdAt: new Date(turma.created_at),
        updatedAt: new Date(turma.updated_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar turmas:", error)
      return []
    }
  },

  /**
   * Obtém uma turma pelo ID
   */
  async getById(id: string): Promise<Turma | null> {
    try {
      const { data, error } = await supabase.from("turmas").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        centroId: data.centro_id,
        formacaoId: data.formacao_id,
        startDate: new Date(data.start_date),
        endDate: new Date(data.end_date),
        maxStudents: data.max_students,
        currentStudents: data.current_students,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error("Erro ao buscar turma:", error)
      return null
    }
  },

  /**
   * Cria uma nova turma
   */
  async create(data: Omit<Turma, "id" | "createdAt" | "updatedAt">): Promise<Turma | null> {
    try {
      const { data: newTurma, error } = await supabase
        .from("turmas")
        .insert([
          {
            centro_id: data.centroId,
            formacao_id: data.formacaoId,
            name: data.name,
            start_date: data.startDate.toISOString().split("T")[0],
            end_date: data.endDate.toISOString().split("T")[0],
            schedule: data.schedule,
            max_students: data.maxStudents,
            current_students: data.currentStudents || 0,
            status: data.status || "scheduled",
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        ...newTurma,
        centroId: newTurma.centro_id,
        formacaoId: newTurma.formacao_id,
        startDate: new Date(newTurma.start_date),
        endDate: new Date(newTurma.end_date),
        maxStudents: newTurma.max_students,
        currentStudents: newTurma.current_students,
        createdAt: new Date(newTurma.created_at),
        updatedAt: new Date(newTurma.updated_at),
      }
    } catch (error) {
      console.error("Erro ao criar turma:", error)
      return null
    }
  },

  /**
   * Atualiza uma turma
   */
  async update(id: string, data: Partial<Turma>): Promise<Turma | null> {
    try {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.schedule) updateData.schedule = data.schedule
      if (data.maxStudents) updateData.max_students = data.maxStudents
      if (data.currentStudents !== undefined) updateData.current_students = data.currentStudents
      if (data.status) updateData.status = data.status

      const { data: updatedTurma, error } = await supabase
        .from("turmas")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        ...updatedTurma,
        centroId: updatedTurma.centro_id,
        formacaoId: updatedTurma.formacao_id,
        startDate: new Date(updatedTurma.start_date),
        endDate: new Date(updatedTurma.end_date),
        maxStudents: updatedTurma.max_students,
        currentStudents: updatedTurma.current_students,
        createdAt: new Date(updatedTurma.created_at),
        updatedAt: new Date(updatedTurma.updated_at),
      }
    } catch (error) {
      console.error("Erro ao atualizar turma:", error)
      return null
    }
  },

  /**
   * Deleta uma turma
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("turmas").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao deletar turma:", error)
      return false
    }
  },
}

// ============================================
// SERVIÇO DE ALUNOS
// ============================================
export const alunoService = {
  /**
   * Obtém todos os alunos de um centro
   */
  async getAll(centroId: string): Promise<Aluno[]> {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .eq("centro_id", centroId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((aluno) => ({
        ...aluno,
        centroId: aluno.centro_id,
        turmaId: aluno.turma_id,
        formacaoId: aluno.formacao_id,
        birthDate: new Date(aluno.birth_date),
        createdAt: new Date(aluno.created_at),
        updatedAt: new Date(aluno.updated_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar alunos:", error)
      return []
    }
  },

  /**
   * Obtém um aluno pelo ID
   */
  async getById(id: string): Promise<Aluno | null> {
    try {
      const { data, error } = await supabase.from("alunos").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        centroId: data.centro_id,
        turmaId: data.turma_id,
        formacaoId: data.formacao_id,
        birthDate: new Date(data.birth_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error("Erro ao buscar aluno:", error)
      return null
    }
  },

  /**
   * Cria um novo aluno
   */
  async create(data: Omit<Aluno, "id" | "createdAt" | "updatedAt">): Promise<Aluno | null> {
    try {
      const { data: newAluno, error } = await supabase
        .from("alunos")
        .insert([
          {
            centro_id: data.centroId,
            formacao_id: data.formacaoId,
            turma_id: data.turmaId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            bi: data.bi,
            address: data.address,
            birth_date: data.birthDate.toISOString().split("T")[0],
            status: data.status || "active",
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        ...newAluno,
        centroId: newAluno.centro_id,
        turmaId: newAluno.turma_id,
        formacaoId: newAluno.formacao_id,
        birthDate: new Date(newAluno.birth_date),
        createdAt: new Date(newAluno.created_at),
        updatedAt: new Date(newAluno.updated_at),
      }
    } catch (error) {
      console.error("Erro ao criar aluno:", error)
      return null
    }
  },

  /**
   * Atualiza um aluno
   */
  async update(id: string, data: Partial<Aluno>): Promise<Aluno | null> {
    try {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.email) updateData.email = data.email
      if (data.phone) updateData.phone = data.phone
      if (data.bi) updateData.bi = data.bi
      if (data.address) updateData.address = data.address
      if (data.status) updateData.status = data.status
      if (data.turmaId) updateData.turma_id = data.turmaId
      if (data.formacaoId) updateData.formacao_id = data.formacaoId

      const { data: updatedAluno, error } = await supabase
        .from("alunos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        ...updatedAluno,
        centroId: updatedAluno.centro_id,
        turmaId: updatedAluno.turma_id,
        formacaoId: updatedAluno.formacao_id,
        birthDate: new Date(updatedAluno.birth_date),
        createdAt: new Date(updatedAluno.created_at),
        updatedAt: new Date(updatedAluno.updated_at),
      }
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error)
      return null
    }
  },

  /**
   * Deleta um aluno
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("alunos").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao deletar aluno:", error)
      return false
    }
  },
}

// ============================================
// SERVIÇO DE PAGAMENTOS
// ============================================
export const pagamentoService = {
  /**
   * Obtém todos os pagamentos de um centro
   */
  async getAll(centroId: string): Promise<Pagamento[]> {
    try {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("centro_id", centroId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((pag) => ({
        ...pag,
        centroId: pag.centro_id,
        alunoId: pag.aluno_id,
        turmaId: pag.turma_id,
        installmentsPaid: pag.installments_paid,
        paymentMethod: pag.payment_method,
        createdAt: new Date(pag.created_at),
        updatedAt: new Date(pag.updated_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error)
      return []
    }
  },

  /**
   * Obtém um pagamento pelo ID
   */
  async getById(id: string): Promise<Pagamento | null> {
    try {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      if (!data) return null

      return {
        ...data,
        centroId: data.centro_id,
        alunoId: data.aluno_id,
        turmaId: data.turma_id,
        installmentsPaid: data.installments_paid,
        paymentMethod: data.payment_method,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error("Erro ao buscar pagamento:", error)
      return null
    }
  },

  /**
   * Cria um novo pagamento
   */
  async create(data: Omit<Pagamento, "id" | "createdAt" | "updatedAt">): Promise<Pagamento | null> {
    try {
      const { data: newPag, error } = await supabase
        .from("pagamentos")
        .insert([
          {
            centro_id: data.centroId,
            aluno_id: data.alunoId,
            turma_id: data.turmaId,
            amount: data.amount,
            installments: data.installments,
            installments_paid: data.installmentsPaid || 0,
            status: data.status || "pending",
            payment_method: data.paymentMethod,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        ...newPag,
        centroId: newPag.centro_id,
        alunoId: newPag.aluno_id,
        turmaId: newPag.turma_id,
        installmentsPaid: newPag.installments_paid,
        paymentMethod: newPag.payment_method,
        createdAt: new Date(newPag.created_at),
        updatedAt: new Date(newPag.updated_at),
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error)
      return null
    }
  },

  /**
   * Atualiza um pagamento
   */
  async update(id: string, data: Partial<Pagamento>): Promise<Pagamento | null> {
    try {
      const updateData: any = {}
      if (data.status) updateData.status = data.status
      if (data.installmentsPaid !== undefined) updateData.installments_paid = data.installmentsPaid
      if (data.paymentMethod) updateData.payment_method = data.paymentMethod

      const { data: updatedPag, error } = await supabase
        .from("pagamentos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        ...updatedPag,
        centroId: updatedPag.centro_id,
        alunoId: updatedPag.aluno_id,
        turmaId: updatedPag.turma_id,
        installmentsPaid: updatedPag.installments_paid,
        paymentMethod: updatedPag.payment_method,
        createdAt: new Date(updatedPag.created_at),
        updatedAt: new Date(updatedPag.updated_at),
      }
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error)
      return null
    }
  },

  /**
   * Deleta um pagamento
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("pagamentos").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error)
      return false
    }
  },
}

// ============================================
// SERVIÇO DE PRESTAÇÕES (Pagamento Installments)
// ============================================
export const pagamentoInstallmentService = {
  /**
   * Obtém todas as prestações de um pagamento
   */
  async getByPagamentoId(pagamentoId: string): Promise<PagamentoInstallment[]> {
    try {
      const { data, error } = await supabase
        .from("pagamento_installments")
        .select("*")
        .eq("pagamento_id", pagamentoId)
        .order("installment_number", { ascending: true })

      if (error) throw error

      return (data || []).map((inst) => ({
        ...inst,
        pagamentoId: inst.pagamento_id,
        installmentNumber: inst.installment_number,
        dueDate: new Date(inst.due_date),
        paidAt: inst.paid_at ? new Date(inst.paid_at) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao buscar prestações:", error)
      return []
    }
  },

  /**
   * Cria novas prestações para um pagamento
   */
  async createBatch(
    pagamentoId: string,
    installments: number,
    totalAmount: number,
    startDate: Date
  ): Promise<PagamentoInstallment[]> {
    try {
      const installmentAmount = totalAmount / installments
      const installmentsData = Array.from({ length: installments }, (_, i) => {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i + 1)

        return {
          pagamento_id: pagamentoId,
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split("T")[0],
          status: "pending",
        }
      })

      const { data, error } = await supabase
        .from("pagamento_installments")
        .insert(installmentsData)
        .select()

      if (error) throw error

      return (data || []).map((inst) => ({
        ...inst,
        pagamentoId: inst.pagamento_id,
        installmentNumber: inst.installment_number,
        dueDate: new Date(inst.due_date),
        paidAt: inst.paid_at ? new Date(inst.paid_at) : undefined,
      }))
    } catch (error) {
      console.error("Erro ao criar prestações:", error)
      return []
    }
  },

  /**
   * Marca uma prestação como paga
   */
  async markAsPaid(id: string): Promise<PagamentoInstallment | null> {
    try {
      const { data, error } = await supabase
        .from("pagamento_installments")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        ...data,
        pagamentoId: data.pagamento_id,
        installmentNumber: data.installment_number,
        dueDate: new Date(data.due_date),
        paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
      }
    } catch (error) {
      console.error("Erro ao marcar prestação como paga:", error)
      return null
    }
  },
}

// ============================================
// SERVIÇO DE USUÁRIOS
// ============================================
export const userService = {
  /**
   * Obtém todos os usuários de um centro
   */
  async getByCentroId(centroId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("centro_id", centroId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((user) => ({
        id: user.id,
        centroId: user.centro_id,
        authUserId: user.auth_user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        lastLogin: user.last_login ? new Date(user.last_login) : undefined,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      }))
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      return []
    }
  },

  /**
   * Obtém um usuário pelo ID
   */
  async getById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        id: data.id,
        centroId: data.centro_id,
        authUserId: data.auth_user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      return null
    }
  },

  /**
   * Cria um novo usuário
   */
  async create(data: {
    centroId: string
    name: string
    email: string
    phone?: string
    role: string
    authUserId?: string
    password?: string
  }): Promise<any | null> {
    try {
      let authUserId = data.authUserId
      let generatedPassword = ""

      // Se não foi fornecido um authUserId, criar uma conta de autenticação no Supabase Auth
      if (!authUserId) {
        // Se não há senha, gerar uma temporária
        if (!data.password) {
          // Gerar senha aleatória de 12 caracteres
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
          generatedPassword = Array.from({ length: 12 }, () =>
            chars.charAt(Math.floor(Math.random() * chars.length))
          ).join("")
        }

        const password = data.password || generatedPassword

        // Criar usuário no Supabase Auth usando signUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password,
          options: {
            data: {
              name: data.name,
              role: data.role,
            },
          },
        })

        if (authError) {
          console.error("Erro ao criar conta de autenticação:", authError)
          throw authError
        }

        if (authData.user) {
          authUserId = authData.user.id
        } else {
          throw new Error("Falha ao criar usuário de autenticação")
        }
      }

      // Criar registro na tabela users com o authUserId
      const { data: newUser, error } = await supabase
        .from("users")
        .insert([
          {
            centro_id: data.centroId,
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            role: data.role,
            auth_user_id: authUserId,
            status: "active",
          },
        ])
        .select()
        .single()

      if (error) throw error

      return {
        id: newUser.id,
        centroId: newUser.centro_id,
        authUserId: newUser.auth_user_id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        status: newUser.status,
        lastLogin: newUser.last_login ? new Date(newUser.last_login) : undefined,
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at),
        generatedPassword: generatedPassword || undefined, // Retornar senha gerada se foi criada
      }
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      return null
    }
  },

  /**
   * Atualiza um usuário
   */
  async update(id: string, data: Partial<any>): Promise<any | null> {
    try {
      const updateData: any = {}
      if (data.name) updateData.name = data.name
      if (data.email) updateData.email = data.email
      if (data.phone !== undefined) updateData.phone = data.phone
      if (data.role) updateData.role = data.role
      if (data.status) updateData.status = data.status

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        id: updatedUser.id,
        centroId: updatedUser.centro_id,
        authUserId: updatedUser.auth_user_id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        status: updatedUser.status,
        lastLogin: updatedUser.last_login ? new Date(updatedUser.last_login) : undefined,
        createdAt: new Date(updatedUser.created_at),
        updatedAt: new Date(updatedUser.updated_at),
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      return null
    }
  },

  /**
   * Deleta um usuário
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      return false
    }
  },

  /**
   * Atualiza o último login
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Erro ao atualizar último login:", error)
      return false
    }
  },
}

