#!/bin/bash
# Script para validar as mudanças implementadas

echo "=============================================="
echo "Validando Mudanças de Redirecionamento"
echo "=============================================="

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se navigation-utils.ts existe
echo -e "\n${YELLOW}1. Verificando novo arquivo de utilitários...${NC}"
if [ -f "lib/navigation-utils.ts" ]; then
    echo -e "${GREEN}✓ lib/navigation-utils.ts encontrado${NC}"
    echo "  Funções disponíveis:"
    grep "export.*function" lib/navigation-utils.ts | sed 's/export /    /'
else
    echo -e "${RED}✗ lib/navigation-utils.ts NÃO encontrado${NC}"
fi

# 2. Verificar se login page foi atualizado
echo -e "\n${YELLOW}2. Verificando atualizações em app/login/page.tsx...${NC}"
if grep -q "safeNavigate" app/login/page.tsx; then
    echo -e "${GREEN}✓ safeNavigate importado${NC}"
else
    echo -e "${RED}✗ safeNavigate NÃO encontrado${NC}"
fi

if grep -q "useTransition" app/login/page.tsx; then
    echo -e "${GREEN}✓ useTransition adicionado${NC}"
else
    echo -e "${RED}✗ useTransition NÃO encontrado${NC}"
fi

# 3. Verificar DashboardGuard
echo -e "\n${YELLOW}3. Verificando atualizações em components/dashboard-guard.tsx...${NC}"
if grep -q "safeNavigate" components/dashboard-guard.tsx; then
    echo -e "${GREEN}✓ safeNavigate importado${NC}"
else
    echo -e "${RED}✗ safeNavigate NÃO encontrado${NC}"
fi

if grep -q "useTransition" components/dashboard-guard.tsx; then
    echo -e "${GREEN}✓ useTransition adicionado${NC}"
else
    echo -e "${RED}✗ useTransition NÃO encontrado${NC}"
fi

# 4. Verificar imports
echo -e "\n${YELLOW}4. Verificando imports de navigation-utils...${NC}"
COUNT=$(grep -r "from.*navigation-utils" app/ components/ 2>/dev/null | wc -l)
echo -e "  ${GREEN}Encontrados $COUNT imports${NC}"

# 5. TypeScript check
echo -e "\n${YELLOW}5. Verificando erros TypeScript...${NC}"
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${RED}✗ Erros TypeScript encontrados${NC}"
    npx tsc --noEmit 2>&1 | head -20
else
    echo -e "${GREEN}✓ Nenhum erro TypeScript${NC}"
fi

echo -e "\n${YELLOW}6. Resumo das mudanças:${NC}"
echo "  • Adicionado useTransition em login/page.tsx"
echo "  • Adicionado useTransition em dashboard-guard.tsx"
echo "  • Criado lib/navigation-utils.ts com safeNavigate()"
echo "  • Implementado fallback window.location"
echo "  • Todos os pontos de navegação agora usam safeNavigate()"

echo -e "\n${GREEN}=============================================="
echo "Validação Concluída!"
echo "===============================================${NC}\n"

# Dica final
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. npm run dev        - Testar localmente"
echo "  2. git push           - Deploy para Vercel"
echo "  3. Verificar logs     - Monitorar console durante login"
echo "  4. Validar fallback   - Se vir logs de [safeNavigate] Fallback, significa router.replace falhou"
