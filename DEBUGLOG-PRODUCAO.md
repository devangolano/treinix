# Debug Log - Problema em Produção

## Problema Identificado
Usuário fazia login com sucesso mas ficava preso em "Redirecionando..." e nunca chegava ao dashboard.

### Sintomas
- Login bem-sucedido (logs mostram perfil carregado)
- Botão fica em estado "Redirecionando..."
- Página nunca muda para dashboard
- Em desenvolvimento funcionava, em produção não

## Root Causes Encontradas

### 1. **DashboardGuard - Condição Lógica Incorreta** ❌ → ✅
**Problema**: Linha 57 tinha `if (isLoading || !hasCheckedAuth.current)`
```tsx
// ERRADO - Criava loading infinito
if (isLoading || !hasCheckedAuth.current) {
  return <Loading />
}
```

**Solução**: Remover o `!hasCheckedAuth.current` da condição
```tsx
// CORRETO - Só mostra loading quando isLoading é true
if (isLoading) {
  return <Loading />
}
```

**Razão**: O `hasCheckedAuth.current` nunca era setado se `isLoading` fosse true, criando uma condição sempre true.

---

### 2. **AuthProvider - Estado não sincronizado** ❌ → ✅
**Problema**: Função `login()` setava `isLoading(false)` mas o `onAuthStateChange` também tentava fazer isso, causando race condition.

**Solução**: Adicionar `setInitialAuthCheckDone(true)` após login bem-sucedido
```tsx
const profile = await getUserProfile(result.data.id)
if (profile) {
  setUser(profile)
  setInitialAuthCheckDone(true)  // NOVO
  setIsLoading(false)
  return { success: true, user: profile }
}
```

**Razão**: Indica ao contexto que o check inicial foi feito, evitando que o listener de auth state mude o estado.

---

### 3. **LoginPage - Timing de Navegação** ❌ → ✅
**Problema**: `setTimeout` não era aguardado antes de fazer redirect
```tsx
// ERRADO
setTimeout(() => {
  router.replace(redirectUrl)
}, 100)
```

**Solução**: Usar Promise com setTimeout
```tsx
// CORRETO
await new Promise(resolve => setTimeout(resolve, 100))
router.replace(redirectUrl)
```

**Razão**: Garante que o estado foi completamente atualizado antes de navegar.

---

### 4. **SubscriptionGuard - Lógica Complexa com Timers** ❌ → ✅
**Problema**: 
- Tinha múltiplos `useEffect` com `lastCheckTime`
- Polling automático a cada 30 segundos
- Listeners de `visibilitychange`
- Múltiplas verificações simultâneas possíveis
- Estados `null` nunca eram tratados

**Solução**: Reescrever completamente com:
1. Usar `useRef` para evitar múltiplas verificações (`checkingRef`)
2. Remover timers e polling
3. Simplificar para apenas 2 `useEffect`:
   - Um para fazer verificação quando auth carrega
   - Um para redirecionar quando status muda
4. Sempre setar `subscriptionStatus` em qualquer caminho

```tsx
const performCheck = async (centroId: string) => {
  // Evitar múltiplas verificações
  if (checkingRef.current) return
  checkingRef.current = true
  setChecking(true)
  
  try {
    // ... lógica de verificação ...
    setChecking(false)
    checkingRef.current = false
  } catch (error) {
    setChecking(false)
    checkingRef.current = false
  }
}

// Effect 1: Fazer verificação
useEffect(() => {
  if (authLoading) return
  if (user?.centroId) performCheck(user.centroId)
  else setChecking(false)
}, [user, authLoading, pathname])

// Effect 2: Redirecionar quando muda
useEffect(() => {
  if (checking) return
  if (!subscriptionStatus?.hasAccess && !isBlockedRoute) {
    router.push("/dashboard/blocked")
  }
}, [checking, subscriptionStatus, isBlockedRoute])
```

**Razão**: 
- Elimina race conditions
- Remove callbacks inúteis que não existiam no guard
- Garante que sempre haverá um estado definido
- Mais fácil de debugar

---

## Fluxo Corrigido

```
1. Usuário clica "Entrar"
   ↓
2. handleSubmit em LoginPage
   ├─ setLoading(true)
   └─ Chama login(email, password)
   ↓
3. login() em use-auth.tsx
   ├─ Faz signIn() ao Supabase
   ├─ Busca getUserProfile()
   ├─ setUser(profile) ✓
   ├─ setInitialAuthCheckDone(true) ✓ NOVO
   ├─ setIsLoading(false) ✓
   └─ Retorna success
   ↓
4. handleSubmit continua
   ├─ Vê que login foi bem-sucedido
   ├─ setIsRedirecting(true)
   ├─ Aguarda 100ms com Promise ✓ NOVO
   └─ router.replace("/dashboard")
   ↓
5. Renderiza DashboardLayout
   ├─ Renderiza DashboardGuard
   │  ├─ useAuth() retorna { user: profile, isLoading: false } ✓
   │  ├─ isLoading é false, então não mostra loading
   │  ├─ user existe, então não redireciona
   │  └─ Renderiza children ✓
   │
   └─ Renderiza SubscriptionGuard
      ├─ authLoading é false
      ├─ user existe com centroId
      ├─ Chama performCheck(centroId) ✓
      ├─ Verifica centro, trial, subscription
      ├─ setSubscriptionStatus com resultado
      ├─ setChecking(false)
      ├─ subscriptionStatus.hasAccess é true (ou bloqueado)
      └─ Renderiza children ou página bloqueada ✓
      ↓
6. Dashboard carrega e mostra dados ✅
```

---

## Resumo das Mudanças

| Arquivo | Mudança | Tipo |
|---------|---------|------|
| `components/dashboard-guard.tsx` | Remover `!hasCheckedAuth.current` da condição | Bugfix |
| `hooks/use-auth.tsx` | Adicionar `setInitialAuthCheckDone(true)` | Bugfix |
| `app/login/page.tsx` | Usar `await new Promise()` em vez de `setTimeout` | Melhoria |
| `components/subscription-guard.tsx` | Reescrever lógica completamente | Refactor + Bugfix |

---

## Por Que Funcionava em Dev e Não em Produção

1. **Em desenvolvimento**: Hot reload do Webpack pode ter mascarado timing issues
2. **Em produção (Vercel)**: 
   - Sem hot reload
   - Diferentes timings de execução
   - Pode ter mais delay na resposta do Supabase
   - Race conditions se tornam evidentes

A solução é mais robusta e não depende de timing específico.

---

## Próximas Steps para Teste

1. Deploy em produção (Vercel)
2. Limpar cache do navegador
3. Tentar login novo com novo usuário
4. Verificar console.logs para validar fluxo
5. Testar redirecionamento para bloqueado (subscription expirada)

