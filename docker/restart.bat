@echo off
echo 🚀 Track.IO - Reiniciando servicios...
echo.

docker-compose down
if %ERRORLEVEL% neq 0 (
    echo ❌ Error al detener servicios
    pause
    exit /b 1
)

echo.
echo 🐳 Reconstruyendo y levantando servicios...
docker-compose up -d --build
if %ERRORLEVEL% neq 0 (
    echo ❌ Error al iniciar servicios
    pause
    exit /b 1
)

echo.
echo ✅ Servicios reiniciados!
echo.
echo 🌐 URLs:
echo    Dashboard: http://localhost
echo    Virtual Device: http://localhost/virtual-device
echo    Backend API: http://localhost:3000
echo.
pause

