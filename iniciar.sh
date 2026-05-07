#!/bin/bash
# ================================================================
# SCRIPT DE INICIALIZAÇÃO RÁPIDA (após setup.sh já executado)
# Abre backend e frontend em paralelo + VS Code
# ================================================================

set -e

AZUL='\033[0;34m'
VERDE='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "${AZUL}🚀 Iniciando App de Separação de Estoque...${NC}"
echo ""

# Abre o VS Code
if command -v code &> /dev/null; then
    code .
fi

# Inicia backend em background
echo -e "  ▶  Iniciando backend (porta 3001)..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Aguarda o backend iniciar
sleep 3

# Inicia frontend
echo -e "  ▶  Iniciando frontend (porta 5173)..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${VERDE}✅ Servidores iniciados!${NC}"
echo -e "  Backend:  http://localhost:3001/api/health"
echo -e "  Frontend: http://localhost:5173"
echo ""
echo -e "  Pressione ${AZUL}Ctrl+C${NC} para parar todos os servidores"
echo ""

# Aguarda até Ctrl+C e encerra os processos
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servidores encerrados.'" EXIT
wait
