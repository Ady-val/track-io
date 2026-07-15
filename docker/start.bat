@echo off
echo 🚀 Track.IO - Iniciando servicios...

REM NOTA: ya NO se hornea la IP en el frontend. Los frontends usan rutas
REM relativas al mismo origen (nginx proxea /api y /socket.io al backend), asi
REM que el mismo build funciona en cualquier IP/dominio sin reconstruir. La IP
REM de abajo se detecta SOLO para mostrar las URLs de acceso.

echo.
echo 🔍 Detectando IP del equipo (solo informativo)...

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R /C:"IPv4.*192\.168\." /C:"IPv4.*10\." /C:"IPv4.*172\."') do (
    set HOST_IP=%%a
    goto :ip_found
)

:ip_found
set HOST_IP=%HOST_IP: =%
if "%HOST_IP%"=="" set HOST_IP=localhost
echo    IP detectada: %HOST_IP%

echo.
echo 🐳 Iniciando Docker Compose...
docker compose down
docker compose up -d --build

if %ERRORLEVEL% neq 0 (
    echo ❌ Error al iniciar
    pause
    exit /b 1
)

echo.
echo ✅ Servicios iniciados correctamente!
echo.
echo 🌐 URLs de acceso:
echo    [Acceso Local]        http://localhost
echo    [Acceso en Red Local] http://%HOST_IP%
echo.
echo 💡 Otros equipos en la red pueden acceder usando la IP: %HOST_IP%
echo    (el frontend detecta el origen automaticamente; no hay que reconstruir
echo     si cambia la IP).
echo.
pause
