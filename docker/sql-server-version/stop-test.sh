#!/bin/bash
# Track.IO - Detener entorno de Testing - SQL Server

echo "Deteniendo entorno de testing (SQL Server)..."

cd "$(dirname "$0")"
docker-compose -f docker-compose.test.yml down

echo ""
echo "Entorno de testing detenido."
