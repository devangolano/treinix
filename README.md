# Treinix - Sistema de Gestão para Centros de Formação

Sistema SaaS completo para gestão de centros de formação em Angola, desenvolvido com Next.js 16, React 19 e TypeScript.

## Características Principais

### 🎯 Sistema Multi-tenant
- Cada centro de formação tem sua própria conta isolada
- Teste grátis de 3 dias para novos centros
- Sistema de subscrições com aprovação manual pelo Super Admin

### 👥 Gestão de Usuários
- **Super Admin**: Controle total da plataforma, aprovação de subscrições
- **Centro Admin**: Gestão completa do centro de formação
- **Secretário/a**: Acesso operacional ao sistema

### 📚 Módulos de Gestão

#### Formações
- Cadastro completo de cursos e formações
- Controle de duração, preços e categorias
- Status ativo/inativo para cada formação

#### Alunos
- Cadastro completo com dados pessoais
- BI, email, telefone e endereço
- Status de matrícula (ativo/inativo)

#### Turmas
- Criação de turmas vinculadas a formações
- Controle de vagas (máximo e atuais)
- Horários e datas de início/término
- Status: Agendada, Em Andamento, Concluída, Cancelada

#### Pagamentos
- Sistema de pagamentos flexível
- Suporte a pagamentos à vista ou em até 2 prestações sem juros
- Métodos: Dinheiro, Transferência, Multicaixa
- Controle individual de cada prestação
- Status automático: Pendente, Parcial, Completo, Cancelado

#### Subscrições
- Visualização do status atual da subscrição
- Planos: Mensal, Trimestral, Semestral, Anual
- Solicitação de renovação com aprovação do Super Admin
- Histórico completo de subscrições

## 🔐 Sistema de Segurança

### Autenticação
- Login seguro com email e senha
- Sessões por role (Super Admin, Centro Admin, Secretário)
- Redirecionamento automático baseado em permissões

### Controle de Acesso
- Middleware de autenticação (proxy.ts)
- SubscriptionGuard para verificar status de subscrição
- Página de bloqueio automática quando subscrição expira
- Bloqueio manual de centros pelo Super Admin

### Estados de Subscrição
- **Trial**: Período de teste de 3 dias
- **Active**: Subscrição ativa e aprovada
- **Pending**: Aguardando aprovação do Super Admin
- **Expired**: Subscrição expirada - acesso bloqueado
- **Blocked**: Centro bloqueado pelo administrador

## 🎨 Design

- Design mobile-first e totalmente responsivo
- Paleta de cores profissional (azul e neutros)
- Componentes shadcn/ui para interface consistente
- Sidebar responsiva com menu móvel
- Alertas contextuais sobre status de subscrição

## 🛠 Tecnologias

- **Next.js 16**: Framework React com App Router
- **React 19.2**: Biblioteca UI com recursos canary
- **TypeScript**: Tipagem estática completa
- **Tailwind CSS v4**: Estilização moderna
- **shadcn/ui**: Componentes de interface
- **Lucide React**: Ícones SVG

## 📁 Estrutura do Projeto

```
app/
├── page.tsx                          # Landing page
├── login/page.tsx                    # Página de login
├── register/page.tsx                 # Registro de novos centros
├── dashboard/                        # Área dos centros
│   ├── layout.tsx                   # Layout com SubscriptionGuard
│   ├── page.tsx                     # Dashboard principal
│   ├── formacoes/page.tsx          # Gestão de formações
│   ├── alunos/page.tsx             # Gestão de alunos
│   ├── turmas/page.tsx             # Gestão de turmas
│   ├── pagamentos/page.tsx         # Gestão de pagamentos
│   ├── usuarios/page.tsx           # Gestão de usuários
│   ├── subscription/page.tsx       # Gestão de subscrição
│   └── blocked/page.tsx            # Página de bloqueio
└── super-admin/                      # Área do Super Admin
    ├── layout.tsx                   # Layout protegido
    ├── page.tsx                     # Dashboard Super Admin
    ├── centros/page.tsx            # Gestão de centros
    └── subscriptions/page.tsx      # Aprovação de subscrições

components/
├── header.tsx                        # Header da landing page
├── hero-section.tsx                  # Seção hero
├── features-section.tsx              # Seção de funcionalidades
├── pricing-section.tsx               # Seção de preços
├── footer.tsx                        # Footer
├── centro-sidebar.tsx                # Sidebar dos centros
├── super-admin-sidebar.tsx           # Sidebar do Super Admin
└── subscription-guard.tsx            # Guard de subscrição

lib/
├── types.ts                          # Tipos TypeScript
├── mock-data.ts                      # Dados mockados
├── utils.ts                          # Utilitários
├── auth-service.ts                   # Serviço de autenticação
├── subscription-service.ts           # Serviço de subscrições
├── super-admin-service.ts            # Serviço do Super Admin
└── centro-services.ts                # Serviços dos centros
```

## 🚀 Funcionalidades Implementadas

### Landing Page
- Hero section com CTA para teste grátis
- Seção de funcionalidades
- Tabela de preços transparente
- Footer com links importantes
- Design profissional e mobile-first

### Painel Super Admin
- Dashboard com estatísticas gerais
- Gestão de todos os centros registrados
- Aprovação/rejeição de subscrições
- Bloqueio/desbloqueio de centros
- Visualização de subscrições pendentes

### Painel dos Centros
- Dashboard com estatísticas do centro
- CRUD completo de Formações
- CRUD completo de Alunos
- CRUD completo de Turmas
- Sistema de Pagamentos em prestações
- Gestão de Usuários (Admin pode criar Secretários)
- Gestão de Subscrição com renovação

### Sistema de Bloqueio
- Verificação automática antes de cada acesso
- Página de bloqueio elegante com opções:
  - Renovar subscrição
  - Contactar suporte
  - Fazer logout
- Alertas sobre fim do período de teste
- Status visual em tempo real

## 📊 Banco de Dados

### Supabase PostgreSQL
Sistema completo com 8 tabelas principais:

```sql
centros              -- Centros de formação (tenants)
usuarios             -- Usuários por centro (admin, secretário, instructor)
subscriptions        -- Subscrições e status de pagamento
formacoes           -- Cursos e formações
turmas              -- Turmas de alunos
alunos              -- Registros de alunos
pagamentos          -- Pagamentos de alunos
pagamento_installments -- Parcelas de pagamentos
```

### Segurança
- Row Level Security (RLS) em produção
- Isolamento multi-tenant por `centro_id`
- Índices para performance
- Triggers para `updated_at` automático

## 🎯 Fluxo de Uso

### Para Novos Centros
1. Acessar landing page
2. Clicar em "Começar Grátis"
3. Preencher formulário de registro
4. Receber 3 dias de teste grátis (salvo em `centros.trial_ends_at`)
5. Acessar dashboard e explorar funcionalidades
6. Antes do fim do teste, solicitar renovação
7. Aguardar aprovação do Super Admin
8. Continuar usando após aprovação

### Para Super Admin
1. Fazer login com role `super_admin`
2. Visualizar estatísticas gerais
3. Aprovar subscrições pendentes
4. Gerenciar centros (bloquear/desbloquear)
5. Monitorar uso da plataforma

### Para Centros Ativos
1. Fazer login (autenticado via Supabase Auth)
2. Dashboard com estatísticas reais
3. Criar formações
4. Cadastrar alunos
5. Organizar turmas
6. Registrar pagamentos
7. Gerenciar usuários do centro
8. Renovar subscrição quando necessário

## 🔑 Acesso Inicial

Para testar o sistema, você precisa:
1. Criar uma conta via `/register`
2. Preencher email e senha
3. Um centro será criado automaticamente
4. Você será adicionado como `centro_admin`
5. Receberá 3 dias de período de teste

## 📝 Mudanças Recentes (22/12/2025)

### ✅ Implementado
- [x] Migração completa para Supabase
- [x] 8 tabelas PostgreSQL
- [x] 8 CRUD services (supabase-services.ts)
- [x] Autenticação Supabase Auth
- [x] Context Hook useAuth
- [x] Trial Dialog inteligente (1x por dia)
- [x] 22 páginas funcionais
- [x] 0 dados mockados
- [x] 0 erros TypeScript

### 🗑️ Removido
- [x] `lib/auth-service.ts` (substituído por supabase-auth.ts)
- [x] `lib/centro-services.ts` (substituído por supabase-services.ts)
- [x] `lib/subscription-service.ts` (substituído por supabase-services.ts)
- [x] `lib/super-admin-service.ts` (substituído por supabase-services.ts)
- [x] `lib/mock-data.ts` (todos os dados do Supabase)
- [x] `migrate-to-supabase.js` (script de migração)
- [x] Dados mockados do dashboard
- [x] Alert inline de "Período de Teste"

### 🔧 Melhorado
- [x] Trial notification via Dialog elegante
- [x] Logout funcional em ambos sidebars
- [x] Async/await patterns corretos
- [x] TypeScript type-safe 100%


