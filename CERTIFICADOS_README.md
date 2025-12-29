# Módulo de Certificados - Documentação Completa

## 📋 Visão Geral

O módulo de certificados é um sistema completo para gerenciar a emissão, armazenamento e rastreamento de certificados de alunos em centros de formação.

### Funcionalidades Principais

#### Para Centros de Formação
- 📊 **Dashboard de Certificados**: Visualizar todos os certificados emitidos
- 📑 **Resumo por Turma**: Ver o número total de alunos e certificados emitidos por turma
- 🎖️ **Emissão de Certificados**: Emitir certificados para alunos de uma turma específica
- 📦 **Modelos de Certificados**: Usar modelos pré-definidos ou fazer upload de modelos customizados
- ✓ **Status Visual**: Indicadores que mostram quais alunos já possuem certificado

#### Para Super Admin
- 🏢 **Gerenciar Modelos**: Criar e gerenciar modelos de certificados para todos os centros
- 📈 **Estatísticas Globais**: Ver estatísticas de certificados emitidos em todos os centros
- 📋 **Histórico Completo**: Monitorar todos os certificados emitidos em todo o sistema

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `certificate_templates`
Armazena os modelos de certificados em PDF que cada centro pode carregar.

```sql
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY,
  centro_id UUID NOT NULL REFERENCES centros(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Campos:**
- `id`: Identificador único
- `centro_id`: Centro que criou o modelo
- `name`: Nome do modelo
- `description`: Descrição opcional
- `pdf_url`: URL pública do arquivo PDF
- `file_path`: Caminho do arquivo no Supabase Storage
- `is_active`: Se o modelo está disponível para uso
- `created_at` / `updated_at`: Timestamps

---

#### 2. `certificates`
Armazena os certificados emitidos para alunos.

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY,
  centro_id UUID NOT NULL REFERENCES centros(id),
  aluno_id UUID NOT NULL REFERENCES alunos(id),
  turma_id UUID NOT NULL REFERENCES turmas(id),
  template_id UUID NOT NULL REFERENCES certificate_templates(id),
  certificate_number VARCHAR(100) NOT NULL UNIQUE,
  pdf_url TEXT,
  file_path VARCHAR(500),
  issue_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'issued',
  issued_by UUID REFERENCES users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoke_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Campos:**
- `id`: Identificador único
- `centro_id`: Centro que emitiu
- `aluno_id`: Aluno que recebeu
- `turma_id`: Turma relacionada
- `template_id`: Modelo usado
- `certificate_number`: Número único do certificado (formato: `CERT-XXXX-YYYYMMDD-XXXXXX`)
- `pdf_url`: URL do certificado gerado (se houver)
- `file_path`: Caminho no storage (se houver)
- `issue_date`: Data de emissão
- `status`: Estado ('issued', 'revoked', 'expired')
- `issued_by`: ID do usuário que emitiu
- `revoked_at` / `revoke_reason`: Informações de revogação
- `created_at` / `updated_at`: Timestamps

---

#### 3. `certificate_logs`
Auditoria de todas as ações relacionadas a certificados.

```sql
CREATE TABLE certificate_logs (
  id UUID PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES certificates(id),
  action VARCHAR(50) NOT NULL,
  action_by UUID REFERENCES users(id),
  action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Campos:**
- `id`: Identificador único
- `certificate_id`: Certificado relacionado
- `action`: Tipo de ação ('issued', 'revoked', 'regenerated', 'viewed')
- `action_by`: Usuário que executou a ação
- `action_date`: Quando a ação foi executada
- `details`: Dados adicionais em JSON
- `created_at`: Timestamp de criação

---

### Views Úteis

#### `certificates_summary_by_turma`
Resumo de certificados por turma com contagem de alunos e certificados.

```sql
SELECT 
  turma_id, 
  turma_name, 
  formacao_name, 
  centro_name,
  total_alunos,
  certificados_emitidos,
  alunos_sem_certificado
```

#### `certificates_detailed`
Detalhes completos de certificados com informações do aluno, turma e centro.

```sql
SELECT 
  certificate_id,
  certificate_number,
  aluno_name,
  turma_name,
  formacao_name,
  centro_name,
  template_name,
  issue_date,
  status,
  issued_by_name
```

---

## 🚀 Uso da API

### Serviços em `lib/certificate-services.ts`

#### Modelos de Certificados

```typescript
// Obter todos os modelos de um centro
getCertificateTemplates(centroId: string): Promise<CertificateTemplate[]>

// Obter um modelo específico
getCertificateTemplate(templateId: string): Promise<CertificateTemplate | null>

// Criar novo modelo
createCertificateTemplate(
  centroId: string,
  template: {
    name: string
    description?: string
    pdfUrl: string
    filePath: string
  }
): Promise<CertificateTemplate>

// Atualizar modelo
updateCertificateTemplate(
  templateId: string,
  updates: Partial<CertificateTemplate>
): Promise<CertificateTemplate>

// Deletar modelo
deleteCertificateTemplate(templateId: string): Promise<void>
```

#### Certificados

```typescript
// Obter todos os certificados de um centro
getCertificates(centroId: string): Promise<Certificate[]>

// Obter certificados por turma
getCertificatesByTurma(turmaId: string): Promise<Certificate[]>

// Obter certificado de um aluno em uma turma
getCertificateByAlunoAndTurma(
  alunoId: string,
  turmaId: string
): Promise<Certificate | null>

// Emitir novo certificado
issueCertificate(
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
): Promise<Certificate>

// Revogar certificado
revokeCertificate(
  certificateId: string,
  revokeReason: string,
  revokedBy: string
): Promise<Certificate>

// Gerar número único de certificado
generateCertificateNumber(
  centroId: string,
  turmaId: string,
  timestamp?: Date
): string
```

#### Logs

```typescript
// Registrar ação de certificado
logCertificateAction(
  certificateId: string,
  action: "issued" | "revoked" | "regenerated" | "viewed",
  actionBy: string,
  details?: Record<string, any>
): Promise<CertificateLog>

// Obter logs de um certificado
getCertificateLogs(certificateId: string): Promise<CertificateLog[]>
```

---

## 📱 Páginas Criadas

### Para Centros (`/app/dashboard/certificados/`)

#### 1. **Página Principal** (`/dashboard/certificados/page.tsx`)
- Exibe resumo de certificados por turma
- Lista de todos os certificados emitidos
- Botão para emitir novo certificado

**Funcionalidades:**
- View em cards do resumo por turma (total de alunos, certificados emitidos)
- Tabela com histórico de certificados
- Links para download de PDFs

#### 2. **Página de Emissão** (`/dashboard/certificados/emitir/page.tsx`)
- Interface para emitir certificados em massa
- Seleção de turma
- Escolha de modelo (pré-definido ou upload customizado)
- Seleção de alunos com indicador visual de quem já possui certificado

**Fluxo:**
1. Usuário seleciona uma turma
2. Sistema carrega alunos da turma
3. Destaca quem já tem certificado
4. Permite escolher modelo ou fazer upload
5. Seleciona alunos para emitir
6. Confirma emissão

---

### Para Super Admin (`/app/super-admin/certificados/`)

#### 1. **Página Principal** (`/super-admin/certificados/page.tsx`)
- Estatísticas globais de certificados por centro
- Tabela com últimos certificados emitidos
- Link para gerenciar modelos

#### 2. **Gerenciador de Modelos** (`/super-admin/certificados/templates/page.tsx`)
- Criar novos modelos de certificados
- Upload de arquivos PDF
- Lista de todos os modelos criados
- Opções para editar/deletar modelos

---

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS configuradas:

- **Super Admin**: Acesso total a todas as tabelas
- **Centro Admin/Secretário**: Acesso apenas aos dados do seu centro
- **Alunos**: Podem visualizar seu próprio certificado (se implementado)

### Storage Security

Os arquivos PDF são armazenados em buckets do Supabase com acesso seguro:
- Certificados: `/centros/{centroId}/`
- Modelos: `/centros/{centroId}/templates/`

---

## 📦 Configuração do Supabase Storage

### Criar Bucket `certificates`

```sql
-- Executar no Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Permitir acesso público de leitura
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificates');

-- Permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');
```

---

## 🔄 Fluxo de Emissão de Certificados

```
Centro Admin
    ↓
Seleciona Turma
    ↓
Escolhe/Faz Upload de Modelo
    ↓
Seleciona Alunos
    ↓
Sistema Verifica:
├─ Aluno não tem certificado nesta turma
├─ Modelo está ativo
└─ Centro tem subscrição ativa
    ↓
Sistema Emite:
├─ Gera número único
├─ Cria registro no banco
├─ Registra no log
└─ Retorna sucesso
    ↓
Centro pode baixar certificado (opcional)
```

---

## 📊 Número de Certificado

Formato: `CERT-{centroId:4}-{YYYYMMDD}-{random:6}`

**Exemplo:** `CERT-a0ee-20241229-ABC123`

---

## 🛠️ Implementação Futura

### Recursos Sugeridos

1. **Geração de PDF Automática**
   - Integrar `pdfkit` ou `puppeteer` para gerar PDFs a partir do template
   - Inserir dados do aluno automaticamente no PDF

2. **Envio de Email**
   - Enviar certificado por email ao aluno
   - Notificação ao admin

3. **Assinatura Digital**
   - Adicionar assinatura digital ao PDF

4. **Download em Massa**
   - Zipfile com múltiplos certificados

5. **Compartilhamento**
   - Gerar link público para compartilhar certificado

6. **Validação Online**
   - Página pública para validar certificado pelo número

---

## 🧪 Testes

### Migração do Banco de Dados

Para aplicar as mudanças no banco:

1. **Copiar o conteúdo de** `supabase/certificados-migration.sql`
2. **Ir ao Supabase Dashboard**
3. **SQL Editor → Executar**
4. **Cole o conteúdo e execute**

### Testar com Dados de Exemplo

```sql
-- Adicionar modelo de exemplo
INSERT INTO certificate_templates (centro_id, name, pdf_url, file_path, is_active)
VALUES 
  ('your-centro-id', 'Modelo Teste', 'https://example.com/cert.pdf', 'test.pdf', true);

-- Emitir certificado de teste
INSERT INTO certificates (centro_id, aluno_id, turma_id, template_id, certificate_number, issue_date, issued_by, status)
VALUES 
  ('your-centro-id', 'aluno-id', 'turma-id', 'template-id', 'CERT-TEST-20241229-000001', NOW()::date, 'user-id', 'issued');
```

---

## 📝 Notas Importantes

1. **Backup de Arquivos**: Os PDFs são armazenados no Supabase Storage. Faça backups regulares.

2. **Número Único**: Cada centro + turma pode gerar um número único. O sistema valida unicidade.

3. **RLS Ativa**: As operações respeitam o Row Level Security. Verifique as permissões antes.

4. **Auditoria**: Todos os certificados possuem log de ações.

5. **Timestamps**: Todos os registros têm `created_at` e `updated_at` automáticos.

---

## 📞 Suporte

Para dúvidas sobre o módulo de certificados, consulte:
- Documentação de Types: `lib/types.ts`
- Serviços: `lib/certificate-services.ts`
- Migração SQL: `supabase/certificados-migration.sql`
