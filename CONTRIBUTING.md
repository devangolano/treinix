# 🤝 Guia de Contribuição

**Projeto:** Formação-AO (SaaS para Centros de Formação)  
**Versão:** 1.0.0  
**Data:** 22 de Dezembro de 2025

---

## 📌 Antes de Começar

Este é um projeto **Next.js + Supabase** com arquitetura bem definida. Antes de fazer alterações, leia este guia.

---

## 🏗️ Arquitetura do Projeto

### Stack Tecnológico
- **Frontend:** Next.js 16 (App Router, TypeScript)
- **Backend:** Supabase (PostgreSQL + Auth)
- **UI:** shadcn/ui + Tailwind CSS
- **State Management:** React Context (useAuth)
- **Validação:** TypeScript (Type-Safe)

### Estrutura de Pastas

```
lib/
├── supabase.ts               # Cliente Supabase (não mexer)
├── supabase-auth.ts          # Autenticação (não mexer sem testar)
├── supabase-services.ts      # CRUD Services (adicione métodos aqui)
├── types.ts                  # TypeScript Interfaces (atualize se mudar DB)
└── utils.ts                  # Funções utilitárias

hooks/
├── use-auth.tsx              # Contexto de autenticação (core)
└── use-toast.ts              # Sistema de notificações

components/
├── ui/                       # Componentes shadcn/ui (readonly)
├── centro-sidebar.tsx        # Sidebar (com logout via signOut)
├── super-admin-sidebar.tsx   # Sidebar admin
└── subscription-guard.tsx    # Guard de subscrição com Trial Dialog

app/
├── (auth)/                   # Rotas de autenticação
│   ├── login/
│   └── register/
├── dashboard/                # Área restrita (check subscription-guard)
│   ├── alunos/
│   ├── formacoes/
│   ├── turmas/
│   ├── pagamentos/
│   ├── usuarios/
│   └── subscription/
└── super-admin/              # Apenas para role === "super_admin"
```

---

## 🔐 Padrões de Código

### ✅ Como Criar uma Nova Página

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { someService } from "@/lib/supabase-services"
import { useToast } from "@/hooks/use-toast"

interface DataType {
  id: string
  name: string
  // ...
}

export default function MyPage() {
  // 1️⃣ Hooks no nível do componente
  const router = useRouter()
  const { user: currentUser } = useAuth()  // ✅ Não dentro de useEffect!
  const { toast } = useToast()

  // 2️⃣ Estados
  const [data, setData] = useState<DataType[]>([])
  const [loading, setLoading] = useState(true)

  // 3️⃣ Efeito que carrega dados
  useEffect(() => {
    if (!currentUser?.centroId) {
      router.push("/login")
      return
    }
    loadData(currentUser.centroId)
  }, [currentUser, router])

  // 4️⃣ Função assíncrona para carregar dados
  const loadData = async (centroId: string) => {
    try {
      setLoading(true)
      const result = await someService.getAll(centroId)  // ✅ Await!
      setData(result)
    } catch (error) {
      console.error("Erro:", error)
      toast({ title: "Erro ao carregar dados", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // 5️⃣ Guard clause
  if (!currentUser) return null

  // 6️⃣ JSX
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <CentroSidebar />
      <div className="flex-1 overflow-auto">
        {/* Seu conteúdo aqui */}
      </div>
    </div>
  )
}
```

### ✅ Como Criar um Novo Serviço

Se precisar adicionar métodos a `lib/supabase-services.ts`:

```typescript
// Em supabase-services.ts, adicione ao serviço apropriado:

export const meuService = {
  async getAll(centroId: string): Promise<MeuTipo[]> {
    try {
      const { data, error } = await supabase
        .from("minha_tabela")
        .select("*")
        .eq("centro_id", centroId)

      if (error) throw error

      return (data || []).map((item) => ({
        ...item,
        centroId: item.centro_id,  // snake_case → camelCase
        // ... outras transformações
      }))
    } catch (error) {
      console.error("Erro:", error)
      return []
    }
  },

  async create(data: Omit<MeuTipo, "id" | "createdAt">): Promise<MeuTipo | null> {
    try {
      const { data: newItem, error } = await supabase
        .from("minha_tabela")
        .insert([{
          centro_id: data.centroId,
          // ... outros campos
        }])
        .select()
        .single()

      if (error) throw error

      return {
        ...newItem,
        centroId: newItem.centro_id,
        // ... transformações
      }
    } catch (error) {
      console.error("Erro:", error)
      return null
    }
  },

  // Implemente create, update, delete, getById conforme necessário
}
```

### ✅ Sistema de Notificações

```typescript
const { toast } = useToast()

// Sucesso
toast({
  title: "Sucesso!",
  description: "Aluno cadastrado com sucesso",
})

// Erro
toast({
  title: "Erro",
  description: "Não foi possível cadastrar",
  variant: "destructive",
})

// Info
toast({
  title: "Informação",
  description: "Isso é uma informação",
})
```

---

## 📋 Checklist Antes de Commitar

- [ ] Código segue os padrões acima
- [ ] Nenhum `console.log` deixado (exceto para debug importante)
- [ ] TypeScript sem erros: `npm run typecheck`
- [ ] Sem referências a arquivos deprecados (auth-service, mock-data, etc)
- [ ] Testou a funcionalidade no navegador
- [ ] Atualizou `lib/types.ts` se mudou o schema
- [ ] Atualizou testes se aplicável

---

## 🗄️ Mudanças no Banco de Dados

### ⚠️ IMPORTANTE

Se precisar fazer mudanças no schema:

1. **Atualize `supabase/schema-dev.sql`** (development)
2. **Atualize `supabase/schema.sql`** (production, com RLS)
3. **Rode as migrações no Supabase:**
   ```bash
   supabase db push
   ```
4. **Atualize `lib/types.ts`** com as novas interfaces
5. **Atualize os serviços** em `lib/supabase-services.ts`

### Exemplo de Nova Tabela

1. Em `supabase/schema-dev.sql`:
```sql
create table if not exists minha_tabela (
  id uuid default gen_random_uuid() primary key,
  centro_id uuid not null references centros(id) on delete cascade,
  nome text not null,
  descricao text,
  status text default 'active',
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_minha_tabela_centro_id on minha_tabela(centro_id);
```

2. Em `lib/types.ts`:
```typescript
export interface MinhaTabela {
  id: string
  centroId: string
  nome: string
  descricao?: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}
```

3. Em `lib/supabase-services.ts`:
```typescript
export const minhaService = {
  async getAll(centroId: string): Promise<MinhaTabela[]> {
    // implementar...
  }
  // etc...
}
```

---

## 🔍 Debugging

### Logs do Supabase
```typescript
const { data, error } = await supabase
  .from("tabela")
  .select("*")

console.log("[Supabase]", { data, error })  // Log estruturado
```

### Verificar Token Auth
```typescript
const { data } = await supabase.auth.getSession()
console.log("[Auth Session]", data.session)
```

### Redux DevTools
```bash
npm run dev
# Abra DevTools (F12) → Redux (se instalado)
```

---

## 📦 Dependências

Antes de adicionar uma nova biblioteca, considere:
- ✅ Já está em `package.json`?
- ✅ É necessária?
- ✅ Está mantida?
- ✅ Compatível com Next.js 16?

**Não instale sem avisar no PR!**

---

## 🧪 Testes

Para testar uma funcionalidade:

```bash
# Compilação
npm run build

# Dev com Turbopack
npm run dev

# Verificar tipos
npm run typecheck

# Linting
npm run lint
```

---

## 🐛 Reportar Bugs

Use este template:

```markdown
**Descrição:**
[Descreva o bug brevemente]

**Passos para reproduzir:**
1. Vá para...
2. Clique em...
3. Observe...

**Comportamento esperado:**
[O que deveria acontecer]

**Comportamento atual:**
[O que está acontecendo]

**Logs/Screenshots:**
[Inclua se disponível]

**Ambiente:**
- Browser: [Ex: Chrome 120]
- OS: [Ex: Ubuntu 22.04]
```

---

## 💡 Sugestões de Features

Use o GitHub Discussions ou abra uma Issue com:

```markdown
**Feature:**
[Nome da feature]

**Descrição:**
[Por que é útil? Quem vai usar?]

**Exemplos de uso:**
[Como o usuário interagiria?]

**Possível implementação:**
[Sua ideia de como fazer]
```

---

## 🎯 Prioridades

| Prioridade | Exemplos | Ação |
|-----------|----------|------|
| 🔴 Crítico | Bugs de segurança, falhas de auth | Fix imediato |
| 🟠 Alto | Features solicitadas, bugs graves | Fix em 1-2 dias |
| 🟡 Médio | Melhorias, bugs menores | Roadmap |
| 🟢 Baixo | Documentação, refactor | Quando tiver tempo |

---

## 📞 Contato

- **Issues:** Use GitHub Issues
- **Discussões:** Use GitHub Discussions
- **Urgente:** Entre em contato direto

---

## 📚 Referências

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)

---

**Obrigado por contribuir! 🙏**

Juntos estamos construindo a melhor plataforma de gestão de centros de formação em Angola! 🇦🇴
