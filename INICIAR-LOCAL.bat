@echo off
title CCG Separacao — Dev Local
color 0A

echo.
echo  ============================================
echo   CCG Separacao — Iniciando Dev Local
echo  ============================================
echo.

set PROJETO=C:\Users\Rodrigo\Documents\projeto-separacao
set NODE="C:\Program Files\nodejs\node.exe"

:: Verifica se o Node está instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERRO: Node.js nao encontrado. Instale em nodejs.org
    pause
    exit /b 1
)

:: Libera portas 3001 e 5173 caso estejam ocupadas
echo  Liberando portas anteriores (3001 e 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  Iniciando Backend (porta 3001)...
start "CCG — Backend" cmd /k "cd /d %PROJETO%\backend && echo Backend iniciando... && npm run dev"

echo  Aguardando backend subir (5s)...
timeout /t 5 /nobreak >nul

echo  Iniciando Frontend (porta 5173)...
start "CCG — Frontend" cmd /k "cd /d %PROJETO%\frontend && echo Frontend iniciando... && npm run dev"

echo  Aguardando frontend compilar (4s)...
timeout /t 4 /nobreak >nul

echo.
echo  ============================================
echo   Sistema rodando!
echo   Backend:  http://localhost:3001/api/health
echo   Frontend: http://localhost:5173
echo   Login:    rodrigo / Correntes2589@
echo  ============================================
echo.

:: Abre o browser automaticamente
start "" "http://localhost:5173"

echo  Feche esta janela quando quiser parar o sistema.
echo  (As janelas do backend e frontend continuam rodando)
pause
