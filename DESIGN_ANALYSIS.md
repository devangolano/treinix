# Análise de Consistência Visual - Padrões Identificados

## 🎨 Padrão Visual Geral

### Cores Base
- **Fundo**: `bg-slate-900` (cinzento escuro)
- **Cards**: `bg-blue-900/30` (azul com transparência)
- **Borda de Cards**: `border-blue-800`
- **Hover**: `hover:border-orange-500`, `hover:bg-blue-900`
- **Texto Principal**: `text-white`
- **Texto Secundário**: `text-blue-200`, `text-blue-300`
- **Botões Primários**: `bg-orange-500 hover:bg-orange-600`

### Layout Principal
```
├─ Sidebar (desktopo oculto em mobile)
├─ Conteúdo
│  ├─ Header (h-screen ou min-h-screen)
│  │  ├─ Título em h1 ou h2
│  │  ├─ Descrição em p.text-blue-200
│  │  └─ Botão de ação (primário)
│  └─ Container
│     └─ Conteúdo (Cards, Tabelas, etc.)
```

### Estrutura HTML
```tsx
<div className="flex flex-col md:flex-row min-h-screen bg-slate-900">
  {/* Sidebar */}
  <Sidebar />
  
  {/* Conteúdo */}
  <div className="flex-1 overflow-auto bg-slate-900 pt-16 md:pt-0">
    <div className="w-full max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Título</h1>
        <p className="text-blue-300">Descrição</p>
      </div>
      
      {/* Conteúdo */}
      <div className="space-y-6">
        {/* Cards e elementos */}
      </div>
    </div>
  </div>
</div>
```

---

## 📊 Componentes Recorrentes

### 1. Header com Título e Botão
```tsx
<div className="flex items-center justify-between mb-6 md:mb-8">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-white">Título</h1>
    <p className="text-blue-200">Descrição</p>
  </div>
  
  <Button className="bg-orange-500 hover:bg-orange-600">
    <Plus className="h-4 w-4 mr-2" />
    Ação
  </Button>
</div>
```

### 2. Cards com Borda Azul
```tsx
<Card className="bg-blue-900/30 border-blue-800 hover:border-orange-500">
  <CardHeader className="pb-4">
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
</Card>
```

### 3. Tabelas
- Dentro de `<Card>`
- Fundo: `bg-blue-900/30`
- Bordas: `border-blue-800`
- Header com fundo ligeiramente mais escuro
- Linhas com hover effect

### 4. Badges/Status
```tsx
<Badge variant="default">Ativo</Badge>
<Badge variant="secondary">Pendente</Badge>
<Badge variant="destructive">Inativo</Badge>
<Badge variant="outline">Outro</Badge>
```

### 5. Grid de Cards de Estatísticas
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card className="bg-blue-900/30 border-blue-800">
    {/* Stats */}
  </Card>
</div>
```

---

## 🔍 Padrões por Página

### Página de Alunos
- ✅ Header com filtros (busca + select)
- ✅ Cards com informações resumidas
- ✅ Ações: Editar, Deletar, Ver
- ✅ Status visual com cores

### Página de Turmas
- ✅ Header com título e botão "Nova Turma"
- ✅ Cards expandíveis por turma
- ✅ Status badges
- ✅ Informações: data, horário, alunos
- ✅ Ações inline

### Página de Pagamentos
- ✅ Tabs para filtros
- ✅ Search + Filter
- ✅ Tabelas com dados
- ✅ Progress bars para prestações
- ✅ Diálogos para detalhes

### Super Admin Dashboard
- ✅ Grid de estatísticas
- ✅ Cards com ícones coloridos
- ✅ Números grandes
- ✅ Descrições curtas

---

## 🎯 Recomendações para Certificados

### 1. **Página Principal de Certificados** (`/dashboard/certificados`)
**Usar o padrão:**
```
Header com título + botão "Emitir Certificado"
  ↓
Resumo de Certificados por Turma (Cards em Grid)
  ↓
Tabela de Certificados Emitidos
```

**Cores:**
- Cards do resumo: `bg-blue-900/30 border-blue-800`
- Números grandes: `text-2xl font-bold`
- Indicadores: Verde para emitidos, Vermelho para revogados

### 2. **Página de Emissão** (`/dashboard/certificados/emitir`)
**Usar o padrão:**
```
Layout de Formulário em 3 Colunas (2 para form, 1 para resumo)
  ├─ Coluna 1-2: Formulário em Cards
  └─ Coluna 3: Card sticky com resumo
```

**Cards do Formulário:**
- Cada seção em um Card separado
- `bg-blue-900/30 border-blue-800`
- Espaçamento consistente

### 3. **Super Admin - Certificados**
**Usar o padrão:**
```
Header + Link para Gerenciar Modelos
  ↓
Estatísticas por Centro (Grid de Cards)
  ↓
Tabela de Certificados Recentes
```

### 4. **Super Admin - Modelos**
**Usar o padrão:**
```
Header + Botão "Novo Modelo"
  ↓
Diálogo para Criar
  ↓
Tabela de Modelos Criados
```

---

## 📱 Responsividade

### Padrão em Todas as Páginas:
- **Desktop**: Sidebar à esquerda + Conteúdo à direita
- **Tablet**: Drawer móvel para sidebar
- **Mobile**: `pt-16` (espaço para menu superior)

**Classes Usadas:**
```tsx
// Layout principal
<div className="flex flex-col md:flex-row">

// Sidebar
<div className="hidden md:flex md:h-screen md:w-64">

// Conteúdo
<div className="flex-1 overflow-auto pt-16 md:pt-0">

// Textos responsivos
<h1 className="text-2xl md:text-3xl">

// Grids responsivos
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## ✨ Elementos Especiais

### Loading States
```tsx
<div className="flex h-screen items-center justify-center bg-slate-900">
  <Spinner />
</div>

// Ou
<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
```

### Empty States
```tsx
<Card className="bg-blue-900/30 border-blue-800">
  <CardContent className="py-12 text-center">
    <Icon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
    <p className="text-blue-300">Mensagem vazia</p>
  </CardContent>
</Card>
```

### Diálogos
- Fundo: Default (não precisa cor especial)
- Botões: Primário/Secundário padrão
- Espaçamento: Consistente

---

## 🔄 Resumo de Cores para Copiar

```css
/* Backgrounds */
bg-slate-900        /* Fundo principal */
bg-blue-900/30      /* Cards */
bg-orange-500       /* Botões primários */

/* Borders */
border-blue-800     /* Cards normais */
border-orange-500   /* Hover em cards */

/* Text */
text-white          /* Títulos e principais */
text-blue-300       /* Descrições */
text-blue-200       /* Labels */
text-blue-100       /* Placeholders */
```

---

## 🎯 Checklist Final

- ✅ Usar `bg-slate-900` para fundo
- ✅ Usar `bg-blue-900/30 border-blue-800` para cards
- ✅ Usar `text-white` para títulos
- ✅ Usar `text-blue-300` para descrições
- ✅ Usar `bg-orange-500` para botões primários
- ✅ Manter consistência de espaçamento (`space-y-6`)
- ✅ Usar `flex` e `grid` para layouts
- ✅ Responsivo: `md:` para desktop, mobile first
- ✅ Consistente com outras páginas
- ✅ Ícones do `lucide-react`
