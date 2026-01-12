#!/bin/bash
# Track.IO - Detener entorno de Producción

echo "🛑 Deteniendo entorno de producción (SQL Server)..."

cd "$(dirname "$0")"

if [ -f .env.production ]; then
    docker compose -f docker-compose.prod.yml --env-file .env.production down
else
    docker compose -f docker-compose.prod.yml down
fi

echo ""
echo "✅ Entorno de producción detenido."
echo ""
echo "💡 Para eliminar también los volúmenes y datos:"
echo "   docker compose -f docker-compose.prod.yml down -v"
echo ""
