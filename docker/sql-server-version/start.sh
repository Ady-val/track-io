#!/bin/bash

echo "🚀 Track.IO - Iniciando servicios (SQL Server)..."

echo ""
echo "🔍 Detectando IP del equipo..."

# Detectar la IP del adaptador de red activo (prioriza redes privadas)
HOST_IP=$(hostname -I | grep -oE '(192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})' | head -n 1)

if [ -z "$HOST_IP" ]; then
    echo "❌ No se pudo detectar la IP del equipo"
    echo "   Usando localhost como fallback"
    HOST_IP="localhost"
fi

echo "   IP detectada: $HOST_IP"

# Verificar si ya existe .env.host y si la IP cambió
REBUILD_NEEDED=1
OLD_IP=""
if [ -f .env.host ]; then
    OLD_IP=$(grep "^HOST_IP=" .env.host | cut -d'=' -f2 | tr -d '\n\r')
    if [ "$OLD_IP" = "$HOST_IP" ]; then
        echo "   IP no ha cambiado ($HOST_IP), omitiendo rebuild..."
        REBUILD_NEEDED=0
    else
        echo "   IP cambió de $OLD_IP a $HOST_IP, rebuild necesario..."
    fi
else
    echo "   Primera ejecución, generando configuración..."
fi

echo ""
echo "📝 Configurando variables de entorno..."
cat > .env.host << EOF
HOST_IP=$HOST_IP
VITE_API_URL=http://$HOST_IP:3000
EOF

echo ""
echo "🐳 Iniciando Docker Compose..."
docker compose down

if [ $REBUILD_NEEDED -eq 1 ]; then
    echo "   Reconstruyendo servicios con nueva IP..."
    # Forzar rebuild del servicio nginx sin caché para asegurar que use la nueva IP
    docker compose --env-file .env.host build --no-cache nginx
    docker compose --env-file .env.host up -d --build
else
    echo "   Iniciando servicios sin rebuild..."
    docker compose --env-file .env.host up -d
fi

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar"
    exit 1
fi

echo ""
echo "✅ Servicios iniciados correctamente!"
echo ""
echo "🌐 URLs de acceso:"
echo "   [Acceso Local]"
echo "     Dashboard:       http://localhost"
echo "     Backend API:     http://localhost:3000"
echo "     SQL Server:      localhost:1433"
echo ""
echo "   [Acceso en Red Local]"
echo "     Dashboard:       http://$HOST_IP"
echo "     Backend API:     http://$HOST_IP:3000"
echo "     SQL Server:      $HOST_IP:1433"
echo ""
echo "💡 Otros equipos en la red pueden acceder usando la IP: $HOST_IP"
echo ""
echo "📊 Base de datos: Microsoft SQL Server 2022"
echo ""
