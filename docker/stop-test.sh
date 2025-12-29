#!/bin/bash
# Track.IO - Detener entorno de Testing

echo "Deteniendo entorno de testing..."

cd "$(dirname "$0")"
docker-compose -f docker-compose.test.yml down

echo ""
echo "Entorno de testing detenido."
