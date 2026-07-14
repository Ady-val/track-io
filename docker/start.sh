#!/bin/bash

echo "🚀 Track.IO - Iniciando servicios..."

# NOTA: ya NO se hornea la IP en el frontend. Los frontends usan rutas relativas
# al mismo origen (nginx proxea /api y /socket.io al backend), así que el mismo
# build funciona en cualquier IP/dominio sin reconstruir. La IP de abajo se
# detecta SOLO para mostrar las URLs de acceso.

echo ""
echo "🔍 Detectando IP del equipo (solo informativo)..."
HOST_IP=$(hostname -I | grep -oE '(192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})' | head -n 1)
if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
fi
echo "   IP detectada: $HOST_IP"

echo ""
echo "🐳 Iniciando Docker Compose..."
docker compose down
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo "❌ Error al iniciar"
    exit 1
fi

echo ""
echo "✅ Servicios iniciados correctamente!"
echo ""
echo "🌐 URLs de acceso:"
echo "   [Acceso Local]        http://localhost"
echo "   [Acceso en Red Local] http://$HOST_IP"
echo ""
echo "💡 Otros equipos en la red pueden acceder usando la IP: $HOST_IP"
echo "   (el frontend detecta el origen automáticamente; no hay que reconstruir"
echo "    si cambia la IP)."
echo ""
