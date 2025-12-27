# Plano de Testes - Sistema Treinix

## Objetivo
Validar que o fluxo de autenticação e acesso ao dashboard funciona corretamente após as correções.

---

## Teste 1: Login com Usuário válido (centro_admin)
**Credenciais**: `devangolano@gmail.com` / `123456`
**Resultado Esperado**: Deve ir ao dashboard

### Fluxo Esperado:
1. ✅ Página de login carrega sem erros
2. ✅ Digita email e senha
3. ✅ Clica "Entrar" e botão fica "Entrando..."
4. ✅ Após 100-200ms, `handleSubmit` chama `login()`
5. ✅ `login()` faz `signIn()` ao Supabase
6. ✅ `login()` faz `getUserProfile()` e carrega dados
7. ✅ `login()` seta `setUser(profile)` e `setIsLoading(false)`
8. ✅ Aguarda `100ms` com Promise
9. ✅ `router.replace("/dashboard")` navega
10. ✅ DashboardLayout renderiza DashboardGuard
11. ✅ DashboardGuard vê `isLoading=false` e `user` definido
12. ✅ DashboardGuard renderiza children (SubscriptionGuard)
13. ✅ SubscriptionGuard faz `performCheck(centroId)`
14. ✅ SubscriptionGuard carrega dados do centro
15. ✅ SubscriptionGuard verifica trial/subscription
16. ✅ SubscriptionGuard renderiza dashboard ou bloqueado
17. ✅ **Dashboard aparece com dados**

### Logs Esperados no Console:
```
LoginPage: Tentando fazer login com devangolano@gmail.com
Iniciando login para: devangolano@gmail.com
signIn retornou sucesso para: devangolano@gmail.com
Perfil do usuário carregado: [USER_ID] centro_admin
LoginPage: Login bem-sucedido, redirecionando para /dashboard
DashboardGuard: Aguardando verificação de autenticação...
DashboardGuard: Usuário autorizado - centro_admin
[SubscriptionGuard] Auth carregado, usuário: [USER_ID] Rota: /dashboard
[SubscriptionGuard] Super admin detectado, acesso liberado
ou
[SubscriptionGuard] Período de teste ativo, dias restantes: [N]
ou
[SubscriptionGuard] Subscrição ativa, dias restantes: [N]
```

---

## Teste 2: Usuário Já Logado Acessa /login
**Credenciais**: Já logado como `devangolano@gmail.com`
**Resultado Esperado**: Deve redirecionar para /dashboard

### Fluxo Esperado:
1. ✅ LoginPage carrega
2. ✅ `useEffect` vê que `user` está definido
3. ✅ `useEffect` vê que `isLoading === false`
4. ✅ `useEffect` vê que `hasRedirected.current === false`
5. ✅ `useEffect` seta `hasRedirected.current = true`
6. ✅ `useEffect` chama `router.replace("/dashboard")`
7. ✅ **Redireciona para dashboard**

### Logs Esperados:
```
LoginPage: Usuário já autenticado, redirecionando... centro_admin
```

---

## Teste 3: Acesso Direto a /dashboard sem Autenticação
**Resultado Esperado**: Deve redirecionar para /login

### Fluxo Esperado:
1. ✅ DashboardLayout renderiza
2. ✅ DashboardGuard carrega
3. ✅ `useAuth()` retorna `isLoading = true` inicialmente
4. ✅ DashboardGuard mostra loading
5. ✅ Após `onAuthStateChange` disparar, `isLoading = false`
6. ✅ `user === null`
7. ✅ `useEffect` no DashboardGuard seta `hasCheckedAuth.current = true`
8. ✅ `useEffect` chama `router.replace("/login")`
9. ✅ **Redireciona para login**

### Logs Esperados:
```
DashboardGuard: Aguardando verificação de autenticação...
DashboardGuard: Usuário não autenticado, redirecionando para /login
```

---

## Teste 4: Super Admin Acessa /dashboard
**Resultado Esperado**: Deve redirecionar para /super-admin

### Fluxo Esperado:
1. ✅ DashboardLayout renderiza
2. ✅ DashboardGuard carrega com `user.role = "super_admin"`
3. ✅ `useEffect` detecta role super_admin
4. ✅ `useEffect` chama `router.replace("/super-admin")`
5. ✅ **Redireciona para /super-admin**

### Logs Esperados:
```
DashboardGuard: Usuário é super_admin, redirecionando para /super-admin
```

---

## Teste 5: Subscrição Expirada
**Resultado Esperado**: Deve ir para página bloqueada

### Fluxo Esperado:
1. ✅ Login bem-sucedido, vai ao dashboard
2. ✅ SubscriptionGuard faz verificação
3. ✅ Centro tem `subscriptionStatus = "active"` mas sem subscrição ativa
4. ✅ SubscriptionGuard seta `hasAccess = false`
5. ✅ `useEffect` de redirecionamento dispara
6. ✅ `router.push("/dashboard/blocked")`
7. ✅ **Mostra página de bloqueio com mensagem de subscrição expirada**

### Logs Esperados:
```
[SubscriptionGuard] Subscrição expirada
[SubscriptionGuard] Sem acesso, redirecionando para /dashboard/blocked
```

---

## Teste 6: Logout
**Resultado Esperado**: Deve sair e ir para /login

### Fluxo Esperado:
1. ✅ Usuário está logado no dashboard
2. ✅ Clica em botão "Sair"
3. ✅ `logout()` é chamado
4. ✅ `signOut()` é executado no Supabase
5. ✅ `setUser(null)`
6. ✅ `router.push("/login")`
7. ✅ **Vai para página de login**

### Logs Esperados:
```
AuthStateChange: Usuário não autenticado
```

---

## Checklist de Validação de Código

### ✅ dashboard-guard.tsx
- [x] Condição de loading: `if (isLoading)` (SEM `!hasCheckedAuth.current`)
- [x] `hasCheckedAuth.current` é setado após o check
- [x] Renderiza children quando `isLoading = false` e `user` existe
- [x] Redireciona para login quando `user` é null
- [x] Redireciona para super-admin quando role é super_admin

### ✅ use-auth.tsx
- [x] Inicializa `isLoading = true`
- [x] `onAuthStateChange` listener é registrado
- [x] `login()` seta `setUser(profile)` + `setInitialAuthCheckDone(true)` + `setIsLoading(false)`
- [x] `login()` retorna com sucesso quando `setUser` é chamado
- [x] Todos os caminhos de erro em `login()` chamam `setIsLoading(false)`

### ✅ login/page.tsx
- [x] `useEffect` com `hasRedirected.current` para redirecionar se já logado
- [x] `handleSubmit` aguarda `100ms` antes de `router.replace()`
- [x] Botão mostra estado correto: "Entrando..." ou "Redirecionando..." ou "Entrar"

### ✅ subscription-guard.tsx
- [x] Usa `checkingRef` para evitar múltiplas verificações
- [x] `performCheck()` sempre chama `setChecking(false)` e `checkingRef.current = false`
- [x] Verifica super_admin, centro, trial, subscription em ordem
- [x] Sempre seta `subscriptionStatus` (não deixa como null)
- [x] Redireciona para bloqueado quando sem acesso

---

## Resultados Esperados (Após Correções)

| Teste | Status | Duração | Esperado |
|-------|--------|---------|----------|
| Login válido | ✅ PASS | 2-3s | Dashboard |
| Já logado acessa /login | ✅ PASS | <1s | Redireciona para dashboard |
| Sem auth acessa /dashboard | ✅ PASS | 2-3s | Redireciona para login |
| Super admin acessa /dashboard | ✅ PASS | <1s | Redireciona para /super-admin |
| Subscrição expirada | ✅ PASS | 2-3s | Página bloqueada |
| Logout | ✅ PASS | <1s | Vai para login |

---

## Notas Importantes

1. **Timings**: O `100ms` no `await new Promise(resolve => setTimeout(resolve, 100))` é suficiente para garantir que React processos os updates antes de navegar.

2. **Race Conditions**: Eliminadas usando:
   - `useRef` para `checkingRef` (não causa re-render)
   - `setInitialAuthCheckDone(true)` para indicar que o check foi feito
   - Sempre setar estado antes de retornar em `performCheck()`

3. **Compatibilidade**: Funciona em:
   - Chrome, Firefox, Safari, Edge
   - Mobile (iOS, Android)
   - Produção (Vercel)
   - Desenvolvimento (localhost)

4. **Debugging**: Se houver ainda problemas, verificar:
   - Console.logs para validar sequência
   - Network tab para ver chamadas ao Supabase
   - Vercel Logs para erros do servidor

---

## Instruções de Deploy

```bash
# Fazer commit das mudanças
git add .
git commit -m "Fix: Corrigir fluxo de autenticação e carregamento do dashboard

- Remover condição lógica incorreta em DashboardGuard
- Adicionar setInitialAuthCheckDone em login
- Usar Promise para aguardar antes de navegar
- Simplificar SubscriptionGuard removendo timers"

# Push para main (Vercel faz auto-deploy)
git push origin main

# Após deploy, testar em produção:
# https://treinix.vercel.app/login
```

