@echo off
setlocal enabledelayedexpansion
REM Track.IO - Iniciar entorno de Producción con SQL Server
REM Este script inicia todos los servicios en modo producción

echo ========================================
echo 🚀 Track.IO - Inicio de Producción (SQL Server)
echo ========================================
echo.

cd /d %~dp0

REM Verificar que existe el archivo .env.production
if not exist .env.production (
    echo ❌ Error: No se encontró el archivo .env.production
    echo.
    echo Por favor, crea el archivo .env.production basándote en .env.production.example:
    echo   copy .env.production.example .env.production
    echo   # Edita .env.production con tus configuraciones
    echo.
    pause
    exit /b 1
)

echo 🔍 Detectando IP del equipo...

REM Detectar la IP de la interfaz de red principal (ruta por defecto)
REM Usa PowerShell para obtener la IP de la interfaz activa, excluyendo interfaces virtuales
set HOST_IP=
for /f "delims=" %%a in ('powershell -ExecutionPolicy Bypass -File "%~dp0get-host-ip.ps1" 2^>nul') do (
    set HOST_IP=%%a
    goto :ip_found
)

REM Si PowerShell falla, usar método alternativo: buscar primera IP privada activa
if "%HOST_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*10\."') do (
        set HOST_IP=%%a
        goto :ip_found
    )
)

:ip_found
REM Limpiar espacios en blanco
set HOST_IP=%HOST_IP: =%

if "%HOST_IP%"=="" (
    echo ⚠️  No se pudo detectar la IP del equipo
    echo    Usando localhost como fallback
    set HOST_IP=localhost
)

echo    IP detectada: %HOST_IP%

REM Verificar si ya existe .env.host.prod y si la IP cambió
set REBUILD_NEEDED=1
set OLD_IP=
if exist .env.host.prod (
    for /f "tokens=2 delims==" %%a in ('findstr /C:"HOST_IP=" .env.host.prod') do set OLD_IP=%%a
    if "%OLD_IP%"=="%HOST_IP%" (
        echo    IP no ha cambiado, saltando rebuild...
        set REBUILD_NEEDED=0
    ) else (
        echo    IP cambió de %OLD_IP% a %HOST_IP%, rebuild necesario...
    )
) else (
    echo    Primera ejecución, generando configuración...
)

echo.
echo 📝 Configurando variables de entorno...

REM Leer CORS_ORIGIN_PROD de .env.production si existe, o usar valores por defecto
set CUSTOM_CORS=
if exist .env.production (
    for /f "tokens=2 delims==" %%a in ('findstr /C:"CORS_ORIGIN_PROD=" .env.production') do set CUSTOM_CORS=%%a
    REM Limpiar comillas
    set CUSTOM_CORS=!CUSTOM_CORS:"=!
)

REM Si hay CORS personalizado y no es "*", combinarlo con los orígenes locales
if not "!CUSTOM_CORS!"=="" (
    if not "!CUSTOM_CORS!"=="*" (
        set CORS_ORIGIN=http://localhost:80,http://%HOST_IP%:80,!CUSTOM_CORS!
    ) else (
        REM Por defecto: incluir localhost e IP local
        set CORS_ORIGIN=http://localhost:80,http://%HOST_IP%:80
    )
) else (
    REM Por defecto: incluir localhost e IP local para permitir acceso desde cualquier dispositivo en la red local
    set CORS_ORIGIN=http://localhost:80,http://%HOST_IP%:80
)

echo HOST_IP=%HOST_IP% > .env.host.prod
echo VITE_API_URL_PROD=http://%HOST_IP%:3000 >> .env.host.prod
echo CORS_ORIGIN_PROD=%CORS_ORIGIN% >> .env.host.prod

echo    CORS_ORIGIN configurado: %CORS_ORIGIN%

echo.
echo 🐳 Deteniendo contenedores existentes...
docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod --profile internal-db down

echo.
if %REBUILD_NEEDED%==1 (
    echo 🔨 Reconstruyendo servicios con nueva IP...
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod --profile internal-db build --no-cache nginx_prod
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod --profile internal-db up -d --build
) else (
    echo ▶️  Iniciando servicios sin rebuild...
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod --profile internal-db up -d
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Error al iniciar los servicios
    echo    Revisa los logs: docker compose -f docker-compose.prod.yml --profile internal-db logs
    pause
    exit /b 1
)

echo.
echo ⏳ Esperando a que los servicios estén listos...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo ✅ Entorno de Producción iniciado!
echo ========================================
echo.
echo 🌐 URLs de acceso:
echo    [Acceso Local]
echo      Dashboard:       http://localhost:80
echo      Backend API:     http://localhost:3000
echo      SQL Server:      localhost:1433
echo.
echo    [Acceso en Red]
echo      Dashboard:       http://%HOST_IP%:80
echo      Backend API:     http://%HOST_IP%:3000
echo      SQL Server:      %HOST_IP%:1433
echo.
echo 📊 Servicios:
echo    - SQL Server 2022
echo    - Backend NestJS (Node.js)
echo    - Nginx (Reverse Proxy)
echo.
echo 📝 Comandos útiles:
echo    Ver logs:          docker compose -f docker-compose.prod.yml --profile internal-db logs -f
echo    Ver estado:        docker compose -f docker-compose.prod.yml --profile internal-db ps
echo    Detener:           stop-prod.bat
echo.
pause
