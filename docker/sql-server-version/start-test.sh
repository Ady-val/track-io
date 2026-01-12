#!/bin/bash
# Track.IO - Iniciar entorno de Testing para Cypress - SQL Server
# Este script inicia SQL Server y Backend en contenedores aislados para testing

echo "========================================"
echo "Track.IO - Entorno de Testing (SQL Server)"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "[1/3] Deteniendo contenedores de testing existentes (si existen)..."
docker-compose -f docker-compose.test.yml down

echo ""
echo "[2/3] Construyendo y iniciando contenedores de testing..."
docker-compose -f docker-compose.test.yml up -d --build

echo ""
echo "[3/3] Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo "========================================"
echo "Entorno de Testing iniciado!"
echo "========================================"
echo ""
echo "Servicios disponibles en:"
echo "  - SQL Server: localhost:1435"
echo "  - Backend API: http://localhost:3001"
echo ""
echo "Para ver los logs:"
echo "  docker-compose -f docker-compose.test.yml logs -f"
echo ""
echo "Para detener el entorno:"
echo "  docker-compose -f docker-compose.test.yml down"
echo ""
