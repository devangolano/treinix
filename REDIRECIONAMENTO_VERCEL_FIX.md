# Solução do Redirecionamento em Loop - Vercel Production

## Problema Original
Login bem-sucedido em Vercel production ficava preso na página de login com "Redirecionando..." indefinidamente, enquanto funcionava perfeitamente no ambiente local.

## Análise da Causa Raiz
O problema era uma **incompatibilidade com `router.replace()` em produção Vercel**:
1. Em local: `router.replace()` funcionava normalmente
2. Em Vercel: `router.replace()` não completava a navegação
3. Resultado: Os guards detectavam que o usuário ainda estava em `/login` e redirectionavam de volta
4. Efeito cascata: Loop infinito de redirecionamentos

## Solução Implementada

### 1. **useTransition Hook (React 18+)**
Adicionado `useTransition` do React para envolver `router.replace()` com melhor controle de transições:

```tsx
const [isPending, startTransition] = useTransition()

startTransition(() => {
  router.replace(url)
})
```

**Benefício**: Permite ao Next.js gerenciar melhor transições de estado em ambiente de produção

### 2. **Fallback com window.location**
Implementado fallback automático para `window.location.href` após timeout:

```tsx
startTransition(() => {
  safeNavigate(router, url, { fallbackDelay: 1500 })
  // Se router.replace() não funcionar, fallback para window.location após 1.5s
})
```

**Benefício**: Garante navegação mesmo se `router.replace()` falhar

### 3. **Utilitário de Navegação Robusta**
Criado arquivo `/lib/navigation-utils.ts` com funções:

- **`safeNavigate()`**: Combina `router.replace()` com fallback `window.location`
- **`safeNavigateAsync()`**: Versão assíncrona com confirmação de navegação

**Uso**:
```tsx
import { safeNavigate } from "@/lib/navigation-utils"

await safeNavigate(router, '/dashboard', { fallbackDelay: 1500 })
```

### 4. **Aplicado em 3 Pontos Críticos**

#### a) `/app/login/page.tsx`
- Auto-redirecionamento se usuário já autenticado
- Redirecionamento pós-login com base em role (super_admin vs centro_admin)

#### b) `/components/dashboard-guard.tsx`
- Verificação de autorização antes de renderizar
- Redirect para `/super-admin` se usuário é super_admin
- Redirect para `/login` se não autenticado

#### c) `/components/subscription-guard.tsx`
- Mantém lógica simples (já estava robusta)

## Arquivos Modificados

```
/app/login/page.tsx                      ✅ Adicionado useTransition + safeNavigate
/components/dashboard-guard.tsx          ✅ Adicionado useTransition + safeNavigate
/lib/navigation-utils.ts                 ✅ NOVO - Utilitário de navegação robusta
```

## Testes Recomendados

### 1. Teste Local (deve continuar funcionando)
```bash
npm run dev
# Validar login → dashboard
# Validar refresh mantém autenticação
```

### 2. Teste Vercel Preview
```bash
# Deploy de preview branch
# Validar login → dashboard com melhor latência
# Validar transição suave
```

### 3. Teste Production
```bash
# Deploy para production
# Monitorar console logs para fallback
# Validar não há loops de redirecionamento
```

## Logging para Debugging

Todos os pontos de navegação possuem logs detalhados:

```
[safeNavigate] Iniciando navegação para /dashboard
[safeNavigate] Fallback timeout de 1500ms atingido
[safeNavigate] Fallback - usando window.location.href para /dashboard
```

## Fallback Behavior

Se `router.replace()` não navegar dentro do timeout especificado:
1. Verifica se ainda está na página anterior
2. Se sim, usa `window.location.href` como fallback
3. Log detalhado de qual método foi usado

## Performance Impact

- ✅ **Mínimo**: Timeout adicional de 1-2 segundos apenas se houver falha
- ✅ **Normal path**: Sem mudança (usa `router.replace()` como antes)
- ✅ **Fallback path**: Completa navegação via `window.location` (hard refresh)

## Notas Importantes

1. **startTransition** requer React 18+ (já incluído no projeto)
2. **safeNavigate** detecta automaticamente ambiente cliente (`typeof window`)
3. **Delays** podem ser ajustados conforme necessário (veja `NavigationOptions`)
4. **window.location** causa hard refresh (perde contexto React temporariamente)

## Próximos Passos se Ainda Não Funcionar

Se Vercel continuar com problemas:

1. **Verificar Middleware**: Revisar `proxy.ts` para loops de redirecionamento
2. **Verificar Cookies**: Validar auth token está sendo salvo/enviado corretamente
3. **Verificar Build**: Verificar se há diferença no build local vs Vercel
4. **Verificar Headers**: Validar cache headers não estão impedindo navegação

## Referências

- [Next.js useTransition - React Docs](https://react.dev/reference/react/useTransition)
- [Next.js App Router Navigation](https://nextjs.org/docs/app/building-your-application/routing/navigation)
- [Vercel Common Issues](https://vercel.com/docs/concepts/solutions/vercel-knowledge-base)
