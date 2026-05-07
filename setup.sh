#!/bin/bash
# ================================================================
# SCRIPT DE SETUP — App de Separação de Estoque
# Casa das Correntes Guanabara Ltda
# ================================================================
# Uso: bash setup.sh
# ================================================================

set -e  # Para na primeira falha

AZUL='\033[0;34m'
VERDE='\033[0;32m'
AMARELO='\033[1;33m'
VERMELHO='\033[0;31m'
NC='\033[0m' # Sem cor

echo ""
echo -e "${AZUL}═══════════════════════════════════════════════════════${NC}"
echo -e "${AZUL}  🏪 Casa das Correntes Guanabara — Separação de Estoque${NC}"
echo -e "${AZUL}  Setup inicial do projeto${NC}"
echo -e "${AZUL}═══════════════════════════════════════════════════════${NC}"
echo ""

# ─── Verifica pré-requisitos ────────────────────────────────────
echo -e "${AMARELO}[1/6] Verificando pré-requisitos...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${VERMELHO}❌ Node.js não encontrado. Instale em: https://nodejs.org${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "  ✅ Node.js: ${NODE_VERSION}"

if ! command -v npm &> /dev/null; then
    echo -e "${VERMELHO}❌ npm não encontrado.${NC}"
    exit 1
fi
echo -e "  ✅ npm: $(npm -v)"

# ─── Copia arquivos .env ────────────────────────────────────────
echo ""
echo -e "${AMARELO}[2/6] Criando arquivos .env...${NC}"

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "  ✅ backend/.env criado (edite com suas configurações)"
else
    echo -e "  ℹ️  backend/.env já existe — mantendo"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "  ✅ frontend/.env criado"
else
    echo -e "  ℹ️  frontend/.env já existe — mantendo"
fi

# ─── Instala dependências do backend ────────────────────────────
echo ""
echo -e "${AMARELO}[3/6] Instalando dependências do backend...${NC}"
cd backend
npm install
echo -e "  ✅ Backend pronto"
cd ..

# ─── Instala dependências do frontend ───────────────────────────
echo ""
echo -e "${AMARELO}[4/6] Instalando dependências do frontend...${NC}"
cd frontend
npm install
echo -e "  ✅ Frontend pronto"
cd ..

# ─── Migrations e Seeds ─────────────────────────────────────────
echo ""
echo -e "${AMARELO}[5/6] Criando banco de dados e usuários iniciais...${NC}"
cd backend
npm run migrate
npm run seed
cd ..

# ─── Abre VS Code ───────────────────────────────────────────────
echo ""
echo -e "${AMARELO}[6/6] Abrindo projeto no VS Code...${NC}"
if command -v code &> /dev/null; then
    code .
    echo -e "  ✅ VS Code aberto"
else
    echo -e "  ⚠️  VS Code (comando 'code') não encontrado no PATH"
    echo -e "  → Abra o VS Code manualmente e selecione esta pasta"
fi

# ─── Instruções finais ──────────────────────────────────────────
echo ""
echo -e "${VERDE}═══════════════════════════════════════════════════════${NC}"
echo -e "${VERDE}  ✅ Setup concluído com sucesso!${NC}"
echo -e "${VERDE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Para iniciar o desenvolvimento, abra ${AMARELO}dois terminais${NC}:"
echo ""
echo -e "  Terminal 1 — Backend:"
echo -e "  ${AZUL}cd backend && npm run dev${NC}"
echo ""
echo -e "  Terminal 2 — Frontend:"
echo -e "  ${AZUL}cd frontend && npm run dev${NC}"
echo ""
echo -e "  Acesse: ${VERDE}http://localhost:5173${NC}"
echo ""
echo -e "  Credenciais de teste:"
echo -e "  ${AMARELO}Coordenador:${NC} vinicius@casadascorrentes.com.br / Vinicius@2024"
echo -e "  ${AMARELO}Vendedor:${NC}    vendedor@casadascorrentes.com.br  / Vendedor@2024"
echo -e "  ${AMARELO}Estoquista:${NC}  estoque.loja@casadascorrentes.com.br / Estoque@2024"
echo -e "  ${AMARELO}Matheus:${NC}     matheus@casadascorrentes.com.br  / Matheus@2024"
echo -e "  ${AMARELO}Antônio:${NC}     antonio@casadascorrentes.com.br  / Antonio@2024"
echo ""
echo -e "${VERDE}═══════════════════════════════════════════════════════${NC}"
