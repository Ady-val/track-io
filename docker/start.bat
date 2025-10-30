@echo off
echo 🚀 Track.IO - Iniciando servicios...

echo.
echo 🔍 Detectando IP del equipo...

REM Detectar la IP del adaptador de red activo
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*10\." /C:"IPv4.*172\."') do (
    set HOST_IP=%%a
    goto :ip_found
)

:ip_found
REM Limpiar espacios en blanco
set HOST_IP=%HOST_IP: =%

if "%HOST_IP%"=="" (
    echo ❌ No se pudo detectar la IP del equipo
    echo    Usando localhost como fallback
    set HOST_IP=localhost
)

echo    IP detectada: %HOST_IP%

REM Verificar si ya existe .env.host y si la IP cambió
set REBUILD_NEEDED=1
if exist .env.host (
    findstr /C:"HOST_IP=%HOST_IP%" .env.host >nul
    if not errorlevel 1 (
        echo    IP no ha cambiado, omitiendo rebuild...
        set REBUILD_NEEDED=0
    ) else (
        echo    IP cambió, rebuild necesario...
    )
) else (
    echo    Primera ejecución, generando configuración...
)

echo.
echo 📝 Configurando variables de entorno...
echo HOST_IP=%HOST_IP% > .env.host
echo VITE_API_URL=http://%HOST_IP%:3000 >> .env.host

echo.
echo 🐳 Iniciando Docker Compose...
docker-compose down

if %REBUILD_NEEDED%==1 (
    echo    Reconstruyendo servicios con nueva IP...
    docker-compose --env-file .env.host up -d --build
) else (
    echo    Iniciando servicios sin rebuild...
    docker-compose --env-file .env.host up -d
)

if %ERRORLEVEL% neq 0 (
    echo ❌ Error al iniciar
    pause
    exit /b 1
)

echo.
echo ✅ Servicios iniciados correctamente!
echo.
echo 🌐 URLs de acceso:
echo    [Acceso Local]
echo      Dashboard:       http://localhost
echo      Virtual Device:  http://localhost/virtual-device
echo      Backend API:     http://localhost:3000
echo.
echo    [Acceso en Red Local]
echo      Dashboard:       http://%HOST_IP%
echo      Virtual Device:  http://%HOST_IP%/virtual-device
echo      Backend API:     http://%HOST_IP%:3000
echo.
echo 💡 Otros equipos en la red pueden acceder usando la IP: %HOST_IP%
echo.
pause