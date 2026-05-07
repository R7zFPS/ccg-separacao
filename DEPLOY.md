# Guia de Deploy — Sistema de Separação de Estoque
> Casa das Correntes Guanabara · Versão 1.0

---

## 📋 Visão Geral

O sistema funciona com **um único servidor Node.js** que serve tanto a API quanto o app React. Basta um computador ligado na rede da loja para todos os celulares e computadores da equipe acessarem.

```
Computador do escritório (servidor)
    ↓ porta 3001
Qualquer dispositivo na rede WiFi da loja acessa: http://192.168.x.x:3001
```

---

## ✅ Pré-requisitos

1. **Node.js 22+** instalado no computador que vai ser o servidor
   - Baixe em: https://nodejs.org → versão LTS (atualmente v22)
   - Verifique: `node --version` (deve mostrar v22 ou maior)
   - ⚠️ **Não use Node 18 ou 20** — o banco de dados interno (`node:sqlite`) exige Node 22+

2. **PM2** (gerenciador de processos — mantém o app rodando 24h)
   ```bash
   npm install -g pm2
   ```

---

## 🚀 Deploy em 5 passos

### Passo 1 — Instalar dependências

```bash
# Na pasta do projeto
cd projeto-separacao

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### Passo 2 — Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` e troque as chaves secretas:
```env
NODE_ENV=production
PORT=3001

# ⚠️  OBRIGATÓRIO: troque estas chaves por valores aleatórios longos
JWT_SECRET=uma_frase_longa_e_aleatoria_aqui_12345
JWT_REFRESH_SECRET=outra_frase_longa_diferente_da_anterior

JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d

DATABASE_PATH=./src/database/separacao.db
UPLOAD_DIR=./src/uploads

# ⚠️  Use * para aceitar acesso da rede local (mesmo servidor)
FRONTEND_URL=*
```

> **Como gerar chaves seguras:** use senhas longas e aleatórias (ex: `gato-azul-corrente-estoque-2024-chave-jwt`). Nunca compartilhe com ninguém.

### Passo 3 — Preparar o banco de dados

```bash
cd backend
npm run migrate   # cria as tabelas
npm run seed      # cria os usuários de teste (só em banco vazio!)
cd ..
```

> ⚠️ **Se o banco já tem dados reais**: rode apenas `npm run migrate`. O seed sobrescreve os usuários!

### Passo 4 — Fazer o build do frontend

```bash
cd frontend
```

Antes do build, edite o arquivo `.env.production` (ou crie se não existir):
```
VITE_API_URL=http://SEU_IP_DO_SERVIDOR:3001
```

Descubra o IP do servidor:
- **Windows**: abra o Prompt de Comando e digite `ipconfig` → procure "Endereço IPv4" (algo como 192.168.1.10)
- **Mac/Linux**: `ifconfig | grep 192`

```bash
npm run build   # gera a pasta dist/
cd ..
```

### Passo 5 — Iniciar com PM2

```bash
# Na pasta raiz (projeto-separacao/)
pm2 start ecosystem.config.js --env production

# Salva para iniciar automaticamente no boot
pm2 save
pm2 startup   # siga a instrução que aparecer na tela
```

**Verificar se está rodando:**
```bash
pm2 status
pm2 logs separacao-ccg
```

**Acessar o sistema:**
- No servidor: `http://localhost:3001`
- Em outros computadores e celulares da rede: `http://192.168.X.X:3001`

---

## 📱 Instalar como App no celular (PWA)

Depois de abrir no navegador do celular:

**Android (Chrome):**
1. Toque nos 3 pontos do Chrome → "Adicionar à tela inicial"
2. Toque em "Adicionar"
3. O ícone aparece na tela inicial como um app normal

**iPhone (Safari):**
1. Toque no botão de compartilhar (retângulo com seta para cima)
2. Role e toque em "Adicionar à Tela de Início"
3. Toque em "Adicionar"

---

## 🔧 Comandos úteis no dia a dia

```bash
# Ver status do servidor
pm2 status

# Ver logs (últimas 100 linhas)
pm2 logs separacao-ccg --lines 100

# Reiniciar o servidor
pm2 restart separacao-ccg

# Parar o servidor
pm2 stop separacao-ccg

# Atualizar o app (após novas versões)
cd frontend && npm run build && cd ..
pm2 restart separacao-ccg
```

---

## 🔄 Atualizar o sistema (novas versões)

Quando houver uma atualização do código:

```bash
cd projeto-separacao

# 1. Atualizar o código (se usar Git)
git pull

# 2. Instalar novas dependências (se houver)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Fazer o build novo
cd frontend && npm run build && cd ..

# 4. Rodar migrations (se houver mudanças no banco)
cd backend && npm run migrate && cd ..

# 5. Reiniciar o servidor
pm2 restart separacao-ccg
```

---

## ⚠️ Solução de Problemas

**"Não consigo acessar de outro computador"**
- Verifique o IP do servidor com `ipconfig` (Windows) ou `ifconfig` (Mac)
- Verifique se o firewall do Windows permite a porta 3001:
  - Painel de Controle → Firewall do Windows → Regras de Entrada → Nova Regra → Porta 3001

**"O servidor parou e não voltou"**
- Execute `pm2 startup` e siga as instruções para configurar o reinício automático
- Verifique os logs: `pm2 logs separacao-ccg`

**"As fotos de upload não aparecem"**
- Verifique se a pasta `backend/src/uploads/fotos/` existe e tem permissão de escrita

**"Esqueci a senha de um usuário"**
- No servidor, execute:
  ```bash
  cd backend
  node -e "
  const db = require('./src/database/db').getDb();
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('NovaSenha123@', 10);
  db.prepare('UPDATE users SET senha_hash=?, primeiro_acesso=1 WHERE usuario_login=?')
    .run(hash, 'NOME_DO_USUARIO');
  console.log('Senha resetada!');
  "
  ```

---

## 🔒 Segurança em rede local

Para uso **somente na rede da loja** (sem acesso externo pela internet):
- A configuração padrão já é segura para uso interno
- As senhas ficam criptografadas no banco (bcrypt)
- Os tokens JWT expiram em 8 horas

Para expor pela **internet** (acesso remoto):
- Necesitará de um domínio e certificado HTTPS (Let's Encrypt)
- Recomendado: usar um serviço de deploy como Railway, Render ou DigitalOcean
- Entre em contato para configurar essa etapa se necessário

---

## 📊 Recursos do servidor

O sistema é leve — funciona em qualquer computador com:
- CPU: qualquer processador moderno
- RAM: mínimo 512 MB disponíveis para o Node.js
- Disco: ~200 MB para o código + espaço para uploads e banco de dados
- Node.js 22+

Computadores com 4+ GB de RAM e SSD são mais que suficientes.
