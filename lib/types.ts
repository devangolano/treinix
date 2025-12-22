// Tipos de usuários
export type UserRole = "super_admin" | "centro_admin" | "secretario"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  centroId?: string
  createdAt: Date
  updatedAt: Date
}

// Tipos de Centro
export interface Centro {
  id: string
  name: string
  email: string
  phone: string
  address: string
  nif?: string
  createdAt: Date
  subscriptionStatus: SubscriptionStatus
  trialEndsAt?: Date
}

// Tipos de Subscrição
export type SubscriptionStatus = "trial" | "active" | "pending" | "expired" | "blocked"

export interface Subscription {
  id: string
  centroId: string
  plan: "mensal" | "trimestral" | "semestral" | "anual"
  months: number
  status: SubscriptionStatus
  startDate: Date
  endDate: Date
  paymentStatus: "pending" | "approved" | "rejected"
  createdAt: Date
}

// Tipos de Formação
export interface Formacao {
  id: string
  centroId: string
  name: string
  description: string
  duration: number // em horas
  price: number
  category: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

// Tipos de Aluno
export interface Aluno {
  id: string
  centroId: string
  name: string
  email: string
  phone: string
  bi: string
  address: string
  birthDate: Date
  status: "active" | "inactive"
  turmaId?: string
  formacaoId?: string
  createdAt: Date
  updatedAt: Date
}

// Tipos de Turma
export interface Turma {
  id: string
  centroId: string
  formacaoId: string
  name: string
  startDate: Date
  endDate: Date
  schedule: string
  maxStudents: number
  currentStudents: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

// Tipos de Pagamento
export interface Pagamento {
  id: string
  centroId: string
  alunoId: string
  turmaId: string
  amount: number
  installments: 1 | 2
  installmentsPaid: number
  status: "pending" | "partial" | "completed" | "cancelled"
  paymentMethod: "cash" | "transfer" | "multicaixa"
  createdAt: Date
  updatedAt: Date
}

export interface PagamentoInstallment {
  id: string
  pagamentoId: string
  installmentNumber: number
  amount: number
  dueDate: Date
  paidAt?: Date
  status: "pending" | "paid" | "overdue"
}
