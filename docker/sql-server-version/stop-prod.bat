@echo off
REM Track.IO - Detener entorno de Producción

echo 🛑 Deteniendo entorno de producción (SQL Server)...
echo.

cd /d %~dp0

if exist .env.production (
    docker compose -f docker-compose.prod.yml --env-file .env.production --profile internal-db down
) else (
    docker compose -f docker-compose.prod.yml --profile internal-db down
)

echo.
echo ✅ Entorno de producción detenido.
echo.
echo 💡 Para eliminar también los volúmenes y datos:
echo    docker compose -f docker-compose.prod.yml --profile internal-db down -v
echo.
pause
