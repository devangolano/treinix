# Fluxo de Pagamentos em Prestações

## 📋 Visão Geral
O sistema agora implementa um fluxo completo para pagamentos em prestações (parcelado), com pagamento obrigatório da primeira prestação durante o cadastro do aluno.

---

## 🎯 Fluxo de Cadastro de Aluno com 2 Prestações

### Passo 1: Preenchimento do Formulário
- Usuário preenche dados pessoais do aluno
- Seleciona formação e turma
- Escolhe método de pagamento: **Pagamento à Vista** ou **Pagamento em 2 Prestações**

### Passo 2: Submissão do Cadastro
Quando o formulário é submetido com **"Pagamento em 2 Prestações"**:

1. ✅ Aluno é cadastrado no sistema
2. ✅ Registro de pagamento é criado com:
   - Status: `pending` 
   - Installments: `2`
   - InstallmentsPaid: `0`
3. ✅ Duas prestações são criadas automaticamente:
   - **1ª Prestação**: 50% do valor (pendente)
   - **2ª Prestação**: 50% do valor (pendente)

### Passo 3: Dialog de Pagamento Obrigatório
Um dialog é exibido pedindo confirmação de pagamento da primeira prestação:

```
┌─────────────────────────────────────────┐
│ Pagamento da Primeira Prestação         │
├─────────────────────────────────────────┤
│ Aluno: João Silva                       │
│ Primeira Prestação: 50,000.00 Kz        │
│                                         │
│ ℹ️ É necessário registrar o pagamento   │
│    da primeira prestação.               │
│                                         │
│ Nota: A segunda prestação poderá ser    │
│ paga posteriormente em Pagamentos.      │
│                                         │
│ [Registrar Depois] [Confirmar Pgt.]    │
└─────────────────────────────────────────┘
```

#### Opções:
- **Confirmar Pagamento**: 
  - Marca 1ª prestação como paga ✓
  - Status do pagamento vai para `partial`
  - Redireciona para lista de alunos automaticamente
  
- **Registrar Depois**: 
  - Vai para lista de alunos
  - Pode registrar pagamento depois em Pagamentos

---

## 💳 Gerenciamento de Prestações em Pagamentos

### Visualizar Prestações
1. Abra a página `/dashboard/pagamentos`
2. Clique em um pagamento com status **"Parcial"** ou **"Pendente"**
3. Dialog exibe todas as prestações

### Estrutura do Dialog

```
┌──────────────────────────────────────────────────┐
│ Prestações do Pagamento                          │
├──────────────────────────────────────────────────┤
│ Aluno: João Silva                                │
│ Turma: Python Básico                             │
│ Total: 100,000.00 Kz                             │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌─ 1ª Prestação ─────────────────────────────┐  │
│ │ 50,000.00 Kz                               │  │
│ │ Vence: 22/01/2026                          │  │
│ │ Pago em: 22/12/2025                        │  │
│ │                                [✓ Pago]   │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ ┌─ 2ª Prestação ─────────────────────────────┐  │
│ │ 50,000.00 Kz                               │  │
│ │ Vence: 22/02/2026                          │  │
│ │                                [Pendente] │  │
│ │                                            │  │
│ │                  [Marcar como Pago]       │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│      [✓ Assinar Próxima Prestação]              │
└──────────────────────────────────────────────────┘
```

### Opções de Ação

#### 1. Marcar Prestação Individual como Paga
- Clique no botão **"Marcar como Pago"** na prestação pendente
- Status muda para `paid` ✓
- Data de pagamento é registrada
- **Dados atualizam automaticamente** em tempo real
- Lista de pagamentos também atualiza

#### 2. Assinar Próxima Prestação (Novo!)
- Botão **verde** na base do dialog
- Aparece quando:
  - Pagamento está em status `partial` 
  - Há prestações pendentes
- Clique para marcar a próxima prestação pendente como paga automaticamente
- **Útil para registrar pagamentos em lote**
- **Todos os dados atualizam em tempo real** (lista, alunos, etc)

---

## 📊 Estados de Pagamento

| Status | Significado | Prestações |
|--------|-------------|-----------|
| `pending` | Nenhuma prestação paga | 0/2 |
| `partial` | Parte pago | 1/2 |
| `completed` | Totalmente pago | 2/2 |
| `cancelled` | Cancelado | X/2 |

---

## 🔄 Fluxo Completo de Exemplo

```
CADASTRO DO ALUNO
    ↓
Aluno + Pagamento em 2 Prestações
    ↓
[Criar aluno + prestações automaticamente]
    ↓
Dialog: Confirmar 1ª Prestação
    ↓ [Confirmar Pagamento]
1ª Prestação: PAGA ✓
Status: PARTIAL
    ↓
[Redireciona para Alunos]
    ↓
[Abrir Pagamentos]
    ↓
2ª Prestação: PENDENTE
    ↓
[Opção 1] Clica em "Marcar como Pago"
    OU
[Opção 2] Clica em "Assinar Próxima Prestação"
    ↓
2ª Prestação: PAGA ✓
Status: COMPLETED ✓
    ↓
Todos os dados atualizam em tempo real:
- Dialog de prestações
- Lista de pagamentos
- Página de alunos
```

---

## 🔄 Atualização de Dados em Tempo Real

### Quando Paga uma Prestação:
1. ✅ Prestação marcada como paga
2. ✅ Dialog de prestações recarrega automaticamente
3. ✅ Status do pagamento atualiza (pending → partial → completed)
4. ✅ Lista de pagamentos recarrega
5. ✅ Página de alunos recarrega (exibe status atualizado)

### Implementação:
```typescript
// Após marcar como pago:
await loadData(currentUser.centroId)  // Recarrega tudo
const updatedPagamento = await pagamentoService.getById(...)  // Get pagamento atualizado
const installments = await pagamentoInstallmentService.getByPagamentoId(...)  // Get prestações
setInstallmentsDialog({ open: true, pagamento: updatedPagamento, installments })  // Atualiza dialog
```

---

## 📝 Observações Importantes

1. **Pagamento Obrigatório**: A primeira prestação DEVE ser paga ao cadastrar aluno com 2 parcelas
2. **Criação Automática**: As prestações são criadas automaticamente com datas espaçadas por 1 mês
3. **Flexibilidade**: O usuário pode optar por "Registrar Depois" se preferir não pagar no momento
4. **Rastreamento**: Cada prestação registra a data de pagamento quando é marcada como paga
5. **Botão de Assinatura**: Acelera o processo de registrar múltiplos pagamentos sequenciais
6. **Sincronização**: Todos os dados sincronizam em tempo real após qualquer ação

---

## 🛠️ Métodos Utilizados

### Serviço de Pagamentos
```typescript
pagamentoService.create()      // Cria pagamento
pagamentoService.update()      // Atualiza status
pagamentoService.getById()     // Obtém pagamento atualizado
```

### Serviço de Prestações
```typescript
pagamentoInstallmentService.createBatch()    // Cria múltiplas prestações
pagamentoInstallmentService.getByPagamentoId() // Obtém prestações de um pagamento
pagamentoInstallmentService.markAsPaid()      // Marca como paga
```

---

## 🎨 UI/UX Melhorias

- ✅ Dialog de confirmação de pagamento obrigatório
- ✅ Cores visuais para diferenciar status
- ✅ Botão verde destacado para "Assinar Próxima Prestação"
- ✅ Datas de vencimento e pagamento claramente visíveis
- ✅ Feedback com toast notifications
- ✅ **Atualização em tempo real de todos os dados**
- ✅ **Sincronização automática entre páginas**

