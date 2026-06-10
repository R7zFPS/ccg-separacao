@echo off
title Casa das Correntes — Dev Local
color 0B
cd /d "%~dp0"

echo.
echo  =============================================
echo   Casa das Correntes Guanabara — Separacao
echo   Dev Local: Backend + Frontend juntos
echo  =============================================
echo.

:: ── Verifica versao do Node (precisa de v22+) ──────────
for /f "tokens=1 delims=v." %%a in ('node --version 2^>nul') do set NODE_MAJOR=%%a
for /f "tokens=2 delims=v." %%a in ('node --version 2^>nul') do set NODE_MAJOR=%%a
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERRO: Node.js nao encontrado!
    echo  Instale em: https://nodejs.org  (versao 22 ou superior)
    pause & exit /b 1
)
echo  Node.js: OK

:: ── Verifica/instala dependencias raiz (concurrently) ──
if not exist "node_modules" (
    echo  Instalando dependencias raiz...
    call npm install --silent
)

:: ── Verifica/instala dependencias do backend ───────────
if not exist "backend\node_modules" (
    echo  Instalando dependencias do backend...
    call npm install --prefix backend --silent
)

:: ── Verifica/instala dependencias do frontend ──────────
if not exist "frontend\node_modules" (
    echo  Instalando dependencias do frontend...
    call npm install --prefix frontend --silent
)

:: ── Libera portas se estiverem em uso ──────────────────
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":3001 "') do (
    taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon 2^>nul ^| findstr ":5173 "') do (
    taskkill /F /PID %%p >nul 2>&1
)

echo.
echo  Iniciando Backend (porta 3001) + Frontend (porta 5173)...
echo  Backend:  http://localhost:3001/api/health
echo  Frontend: http://localhost:5173
echo.
echo  Login: rodrigo / Correntes2589@
echo.
echo  >> Aguardando servidores subirem...
echo  >> Pressione Ctrl+C para parar tudo.
echo.

:: ── Abre o browser automaticamente apos 8s (backend precisa subir) ──
start /b cmd /c "timeout /t 8 /nobreak >nul && start """" ""http://localhost:5173"""

:: ── Inicia backend e frontend juntos com concurrently ──
call npm run dev
