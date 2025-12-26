# Solução de Problemas - Login em Produção e Erro do Manifest

## Problemas Identificados e Solucionados

### 1. **Erro "Manifest: Line: 1, column: 1, Syntax error"**

**Causa:** O arquivo `manifest.json` gerado automaticamente em `/public/manifest.json` pode estar corrompido ou não ser gerado corretamente durante a build.

**Solução:**
- O arquivo `app/manifest.ts` está correto e segue a especificação do Next.js
- Execute `npm run build` (ou `pnpm build`) para regenerar o manifest
- Se o erro persistir, limpe o cache:
  ```bash
  rm -rf .next
  rm -rf node_modules/.cache
  pnpm build
  ```

---

### 2. **Redirecionamento Não Funciona em Produção (Status 307)**

**Causa:** Em produção, havia delays na resposta e o `router.push()` pode não estar funcionando corretamente por:
- Cache do navegador interferindo
- Delay insuficiente entre autenticação e redirecionamento
- Estado de sessão não totalmente estabelecido

**Soluções Implementadas:**

#### a) **Arquivo `/app/login/page.tsx`**
- ✅ Adicionado estado `isRedirecting` para rastrear redirecionamento
- ✅ Aumentado delay de 500ms para 1000ms (1 segundo)
- ✅ Trocado `router.push()` por `router.replace()` para evitar histórico duplicado
- ✅ Adicionado fallback com `window.location.href` após 2 segundos
- ✅ Melhorado feedback visual durante redirecionamento

#### b) **Novo arquivo `/middleware.ts`**
- ✅ Desabilita cache para rotas de autenticação (login, register, dashboard, super-admin)
- ✅ Define headers apropriados de cache control:
  - `Cache-Control: no-store, no-cache, must-revalidate`
  - `Pragma: no-cache`
  - `Expires: 0`

#### c) **Arquivo `/hooks/use-auth.tsx`**
- ✅ Adicionado logging detalhado para debug
- ✅ Melhorado tratamento de erros

---

## Mudanças Realizadas

### 1. `/app/login/page.tsx`
```typescript
// Novo estado para rastrear redirecionamento
const [isRedirecting, setIsRedirecting] = useState(false)

// Melhorado handleSubmit com:
// - Delay aumentado para 1s
// - router.replace() em vez de router.push()
// - Fallback com window.location.href
// - Status visual melhorado
```

### 2. `/middleware.ts` (NOVO)
Criado arquivo de middleware para:
- Controlar cache de páginas autenticadas
- Garantir que o navegador não use versão em cache das páginas

### 3. `/hooks/use-auth.tsx`
```typescript
// Adicionado logging detalhado:
console.log("Login bem-sucedido para:", email)
console.log("Perfil do usuário carregado:", profile.id, profile.role)
console.error("Falha ao carregar perfil do usuário")
```

---

## Como Testar em Produção

### 1. Build Local
```bash
pnpm build
pnpm start
```

Teste o login em `http://localhost:3000/login`

### 2. Verificar Network (DevTools)
- Abra as DevTools (F12)
- Vá para aba **Network**
- Faça login
- Verifique:
  - ✅ Requisição de login retorna 200 com token
  - ✅ Requisição de usuário retorna 200 com dados
  - ✅ Redirecionamento acontece após 1s (status 307 é normal, vem do router.replace)

### 3. Verificar Console
Você deve ver logs como:
```
"Login bem-sucedido para: seu@email.com"
"Perfil do usuário carregado: [user-id] centro_admin"
```

---

## Investigação do Erro 307

Os status 307 (Temporary Redirect) que você vê são **esperados** quando há redirecionamento:
- 307 vem de `router.replace()` funcionando corretamente
- O que importa é que o usuário é redirecionado para `/dashboard`

Se o redirecionamento ainda não funcionar:

### 1. Verifique a URL no navegador
- Depois do login, deve estar em `https://seu-dominio/dashboard`
- Se estiver em `https://seu-dominio/login`, o redirect falhou

### 2. Ative o fallback de debug
Edite `/app/login/page.tsx` e adicione após `router.replace()`:
```typescript
console.log("Redirect para:", redirectUrl)
console.log("Tentando router.replace()...")

router.replace(redirectUrl)

setTimeout(() => {
  console.log("Fallback: usando window.location.href")
  window.location.href = redirectUrl
}, 2000)
```

### 3. Verifique variáveis de ambiente
Em produção, certifique-se que está definido:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## Checklist Final

- [ ] Executar `pnpm build` para regenerar manifest
- [ ] Verificar que middleware.ts foi criado
- [ ] Testar login localmente com `pnpm start`
- [ ] Confirmar redirecionamento funciona
- [ ] Deploy em produção
- [ ] Verificar Network tab no DevTools em produção
- [ ] Confirmar que chega ao `/dashboard`

---

## Se Ainda Tiver Problemas

1. **Limpar cache do navegador:**
   - Pressione `Ctrl+Shift+Delete` (ou `Cmd+Shift+Delete` no Mac)
   - Selecione "Limpar dados de navegação"
   - Tente login novamente

2. **Redeployar em produção:**
   ```bash
   pnpm build
   pnpm start
   # ou fazer deploy novamente na Vercel
   ```

3. **Verificar logs do servidor:**
   - Na Vercel, vá para seu projeto → Deployments
   - Verifique os logs da build e runtime

---

## Resumo das Correções

| Problema | Solução | Arquivo |
|----------|---------|---------|
| Redirecionamento não funciona | Router.replace() + delay 1s + fallback | `/app/login/page.tsx` |
| Cache do navegador interfere | Headers de no-cache | `/middleware.ts` (novo) |
| Falta logging para debug | Console.logs detalhados | `/hooks/use-auth.tsx` |
| Manifest corrompido | Regenerar com build | Nenhuma mudança necessária |

