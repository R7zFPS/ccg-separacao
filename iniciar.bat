@echo off
title Casa das Correntes — Iniciando...
echo.
echo =============================================
echo   Casa das Correntes Guanabara - Separacao
echo =============================================
echo.

:: Vai para a pasta do projeto
cd /d "%~dp0"

:: Instala concurrently se nao existir
if not exist "node_modules" (
    echo Instalando dependencias raiz...
    call npm install
    echo.
)

:: Inicia backend e frontend juntos
echo Iniciando Backend + Frontend...
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Para encerrar: feche esta janela ou pressione Ctrl+C
echo.

:: Pequena pausa e abre o navegador automaticamente
timeout /t 4 /nobreak > nul
start "" "http://localhost:5173"

call npm run dev
