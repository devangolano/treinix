# Certificados - Controle de Acesso

## 📋 Visão Geral

Este documento descreve a lógica de controle de acesso do módulo de certificados para diferentes papéis de usuário.

---

## 🔐 Papéis de Usuário

### 1. Super Admin (`super_admin`)

**Permissões:**
- ✅ Acessar `/super-admin/certificados` - Dashboard global
- ✅ Acessar `/super-admin/certificados/templates` - Gerenciar modelos
- ✅ Criar modelos de certificados para QUALQUER centro
- ✅ Ver modelos de TODOS os centros
- ✅ Ver certificados de TODOS os centros
- ✅ Ver estatísticas globais por centro
- ✅ Deletar modelos e certificados

**Páginas Protegidas:**
- Verificação: `if (user.role !== "super_admin") router.push("/dashboard")`
- Redirecionamento: Para `/dashboard` (centro admin)

---

### 2. Centro Admin (`centro_admin`)

**Permissões:**
- ✅ Acessar `/dashboard/certificados` - Dashboard do centro
- ✅ Acessar `/dashboard/certificados/emitir` - Emitir certificados
- ✅ Ver apenas modelos do PRÓPRIO centro
- ✅ Selecionar modelos para emitir certificados
- ✅ Upload de PDF customizado para seu centro
- ✅ Ver certificados emitidos no próprio centro
- ❌ Gerenciar modelos (apenas super admin)
- ❌ Ver modelos de outros centros
- ❌ Ver certificados de outros centros

**Páginas Protegidas:**
- Redirecionamento automático para `/login` se não autenticado
- Acesso negado ao `/super-admin/*` (redirecionado para `/dashboard`)

---

## 📁 Estrutura de Acesso por Rota

```
/dashboard/certificados/
├── page.tsx           → Centro Admin (lista certificados do centro)
└── emitir/page.tsx   → Centro Admin (emitir certificados)

/super-admin/certificados/
├── page.tsx           → Super Admin (dashboard global)
└── templates/page.tsx → Super Admin (gerenciar modelos globais)
```

---

## 🔍 Lógica de Filtro por Centro

### Centro Admin - Carregamento de Templates

```typescript
// app/dashboard/certificados/emitir/page.tsx
const centroId = user?.centroId

// Carrega APENAS templates do seu centro
const templates = await getCertificateTemplates(centroId)
```

**Função utilizada:**
```typescript
// lib/certificate-services.ts
export async function getCertificateTemplates(centroId: string) {
  return supabase
    .from("certificate_templates")
    .select("*")
    .eq("centro_id", centroId)        // ← Filtra por centro
    .eq("is_active", true)
    .order("created_at", { ascending: false })
}
```

---

### Super Admin - Carregamento de Modelos

```typescript
// app/super-admin/certificados/templates/page.tsx
// Carrega templates de TODOS os centros (sem filtro)
const { data: templatesData } = await supabase
  .from("certificate_templates")
  .select("*, centros(name) as centro_data")
  .order("created_at", { ascending: false })
```

**Função disponível (não usada atualmente, mas disponível):**
```typescript
// lib/certificate-services.ts
export async function getAllCertificateTemplates() {
  return supabase
    .from("certificate_templates")
    .select("*")
    .order("created_at", { ascending: false })
    // ← Sem filtro, retorna todos os templates
}
```

---

## 🛡️ Segurança

### Row Level Security (RLS)

Atualmente **desativado** nas políticas, mas **habilitado** nas tabelas:

```sql
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_logs ENABLE ROW LEVEL SECURITY;
```

**Motivo:** RLS implementado na aplicação (camada de negócio) via validação de `user.centroId`

### Recomendações Futuras

Se implementar RLS no Supabase:

```sql
-- Super Admin: acesso total
CREATE POLICY "Super admin templates" ON certificate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Centro Admin: apenas seus templates
CREATE POLICY "Centro admin templates" ON certificate_templates
  FOR SELECT USING (
    centro_id = (
      SELECT centroId FROM users WHERE id = auth.uid()
    )
  );
```

---

## 🔄 Fluxo de Emissão de Certificados

1. **Centro Admin acessa** `/dashboard/certificados/emitir`
2. **Seleciona turma** do seu centro
3. **Sistema carrega alunos** da turma selecionada
4. **Visualiza modelos** criados pelo super admin para seu centro
5. **Seleciona modelo** ou faz upload de PDF customizado
6. **Seleciona alunos** para emitir certificados
7. **Sistema emite certificados** com rastreamento

---

## 📊 Matriz de Permissões

| Ação | Super Admin | Centro Admin |
|------|:-----------:|:-----------:|
| Ver dashboard global | ✅ | ❌ |
| Ver dashboard do centro | ❌ | ✅ |
| Criar modelos | ✅ | ❌ |
| Ver todos os modelos | ✅ | ❌ |
| Ver modelos do centro | ✅ | ✅ |
| Emitir certificados | ❌ | ✅ |
| Ver todos os certificados | ✅ | ❌ |
| Ver certificados do centro | ✅ | ✅ |
| Deletar modelos | ✅ | ❌ |
| Deletar certificados | ✅ | ❌ |

---

## ⚠️ Considerações Importantes

1. **Centros NÃO podem criar modelos** - Apenas super admin
2. **Centros podem selecionar qualquer modelo do seu centro** - Sem restrição
3. **Upload de PDF customizado** - Centros podem fazer, mas é temporário
4. **Certificados revogados** - Apenas super admin pode revogar
5. **Auditoria** - `certificate_logs` registra todas as ações

---

## 🚀 Implementação Futura

- [ ] Implementar RLS completo no Supabase
- [ ] Adicionar mais roles de usuário (ex: `instrutor`, `coordenador`)
- [ ] Dashboard de relatórios para centros
- [ ] API de download de certificados em lote
- [ ] Integração com gerenciamento de inscrições

---

**Última atualização:** 29 de dezembro de 2025
