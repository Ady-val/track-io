@echo off
echo 🚀 Track.IO - Iniciando servicios...

echo.
echo 🐳 Iniciando Docker Compose...
docker-compose down
docker-compose up -d --build

if %ERRORLEVEL% neq 0 (
    echo ❌ Error al iniciar
    pause
    exit /b 1
)

echo.
echo ✅ Servicios iniciados!
echo.
echo 🌐 URLs:
echo    Dashboard: http://localhost
echo    Virtual Device: http://localhost/virtual-device
echo    Backend API: http://localhost:3000
echo.
pause