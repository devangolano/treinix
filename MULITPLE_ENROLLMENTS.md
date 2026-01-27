# Sistema de Matrículas Múltiplas - Documentação de Implementação

## 📋 Resumo da Mudança

O sistema foi refatorado para permitir que **alunos já matriculados possam se matricular novamente em outras formações**. Agora o fluxo é:

1. **Cadastro de Aluno** → Criar aluno com dados pessoais (formação é opcional)
2. **Matrícula** → Aluno pode ter múltiplas matrículas em diferentes formações
3. **Pagamento** → Cada matrícula tem seu próprio pagamento associado

---

## 🔄 Fluxo de Uso

### Para Novo Aluno:
1. Clique em "Novo Aluno"
2. Preencha **dados pessoais** (obrigatório)
3. *Opcional*: Selecione formação e turma para criar a primeira matrícula
4. Aluno criado! Pode adicionar mais matrículas depois

### Para Aluno Existente (Adicionar Matrícula):
1. Na lista de alunos, clique no menu do aluno
2. Selecione "**Matricular**" (novo ícone em laranja)
3. Os dados pessoais aparecem **pré-preenchidos**
4. Selecione a **nova formação** e **turma**
5. Configure **método de pagamento** e **número de prestações**
6. Salvar!

---

## 🗄️ Mudanças no Banco de Dados

### Nova Tabela: `matriculas`
```sql
CREATE TABLE matriculas (
  id UUID PRIMARY KEY,
  aluno_id UUID (referencia aluno)
  centro_id UUID (referencia centro)
  formacao_id UUID (qual formação)
  turma_id UUID (qual turma)
  status VARCHAR (active, inactive, completed, cancelled)
  enrollment_date TIMESTAMP
  completion_date TIMESTAMP (opcional)
  notes TEXT (opcional)
  created_at TIMESTAMP
  updated_at TIMESTAMP
  
  CONSTRAINT unique: Um aluno não pode ter a mesma combinação formacao+turma 2x
)
```

### Tabela `alunos` (Modificada)
- **Removido**: `formacao_id` (agora em matriculas)
- **Removido**: `turma_id` (agora em matriculas)
- Agora armazena **apenas dados pessoais**

### Tabela `pagamentos` (Modificada)
- **Adicionado**: `matricula_id` (referencia a qual matrícula está sendo paga)
- **Mantido**: `aluno_id` e `turma_id` (para compatibilidade)

---

## 💻 Mudanças no Código TypeScript

### Tipos Novos (`lib/types.ts`)

```typescript
// Matrícula
interface Matricula {
  id: string
  alunoId: string
  centroId: string
  formacaoId: string
  turmaId: string
  status: "active" | "inactive" | "completed" | "cancelled"
  enrollmentDate: Date
  completionDate?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Aluno (simplificado)
interface Aluno {
  id: string
  centroId: string
  name: string
  email: string
  phone: string
  bi: string
  address: string
  birthDate: Date
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

// Pagamento (atualizado)
interface Pagamento {
  id: string
  centroId: string
  alunoId: string
  matriculaId: string  // ← NOVO
  turmaId: string
  amount: number
  installments: 1 | 2
  installmentsPaid: number
  status: "pending" | "partial" | "completed" | "cancelled"
  paymentMethod: "cash" | "transfer" | "multicaixa"
  createdAt: Date
  updatedAt: Date
}
```

### Novo Serviço: `matriculaService` (`lib/supabase-services.ts`)

```typescript
export const matriculaService = {
  async getAll(centroId: string): Matricula[]      // Todas as matrículas do centro
  async getByAlunoId(alunoId: string): Matricula[] // Matrículas de um aluno
  async getById(id: string): Matricula | null      // Uma matrícula específica
  async create(data): Matricula | null             // Criar nova matrícula
  async update(id, data): Matricula | null         // Atualizar matrícula
  async delete(id: string): boolean                // Deletar matrícula
}
```

---

## 📁 Novos Arquivos

### `app/dashboard/alunos/[id]/nova-matricula/page.tsx`
- **Propósito**: Página para adicionar nova matrícula a aluno existente
- **Dados pré-preenchidos**: Nome, email, telefone, BI do aluno
- **Formulário**: Selecionar formação, turma, método de pagamento
- **Ação**: Cria matrícula + pagamento com prestações

---

## 🎯 Fluxo de Criação de Matrícula

```
1. Usuário clica "Matricular" no menu do aluno
   ↓
2. Abre página `/alunos/[id]/nova-matricula`
   ↓
3. Dados do aluno carregam (Name, Email, Phone, BI)
   ↓
4. Usuário seleciona:
   - Formação (lista de formações disponíveis)
   - Turma (filtrada pela formação selecionada)
   - Método de Pagamento (Dinheiro, Transferência, Multicaixa)
   - Número de Prestações (1 ou 2)
   ↓
5. Clica "Criar Matrícula"
   ↓
6. Sistema executa:
   a) Cria registro em matriculas
   b) Cria pagamento com matricula_id
   c) Cria prestações (1 ou 2)
   ↓
7. Redireciona para lista de alunos com toast de sucesso
```

---

## 🔐 Segurança (RLS - Row Level Security)

Políticas adicionadas para `matriculas`:
- Super Admin: vê todas as matrículas
- Centro: gerencia suas próprias matrículas
- Usuário autenticado: pode criar matrículas

---

## ✅ Checklist de Implementação

- [x] Criar tabela `matriculas` no Supabase
- [x] Remover `formacao_id` e `turma_id` de `alunos`
- [x] Adicionar `matricula_id` em `pagamentos`
- [x] Atualizar tipos TypeScript
- [x] Criar `matriculaService`
- [x] Criar página `nova-matricula`
- [x] Atualizar página `novo/page.tsx` (matrícula opcional)
- [x] Adicionar opção "Matricular" no menu de alunos
- [x] Atualizar `alunoService` (remover campos de matrícula)
- [x] Atualizar `pagamentoService` (adicionar matricula_id)
- [x] Adicionar políticas RLS para matriculas

---

## ⚠️ Migração de Dados (Se necessário)

Se você tem dados antigos com `formacao_id` e `turma_id` em alunos, execute:

```sql
-- Copiar matrículas antigas para a nova tabela
INSERT INTO matriculas (aluno_id, centro_id, formacao_id, turma_id, status)
SELECT id, centro_id, formacao_id, turma_id, 'active'
FROM alunos
WHERE formacao_id IS NOT NULL AND turma_id IS NOT NULL;

-- Depois remover as colunas antigas
ALTER TABLE alunos DROP COLUMN formacao_id;
ALTER TABLE alunos DROP COLUMN turma_id;
```

---

## 🚀 Próximos Passos

1. **Executar** a migração no Supabase (`migrations/add-multiple-enrollments.sql`)
2. **Testar** o fluxo completo:
   - Criar novo aluno (com e sem matrícula inicial)
   - Adicionar matrícula a aluno existente
   - Verificar pagamentos e prestações
3. **Atualizar** outras páginas que referenciam `aluno.formacaoId` ou `aluno.turmaId`
4. **Testar** permissões de acesso (RLS)

