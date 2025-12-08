#!/bin/bash

echo "🚀 Track.IO - Iniciando servicios..."

echo ""
echo "🔍 Detectando IP del equipo..."

# Detectar la IP del adaptador de red activo (prioriza redes privadas)
# Primero intenta con hostname -I (Linux)
HOST_IP=$(hostname -I 2>/dev/null | grep -oE '(192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})' | head -n 1)

# Si no funciona, intenta con ip route (Linux)
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K[0-9.]+' | head -n 1)
fi

# Si aún no funciona, intenta con ifconfig (macOS/Linux)
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(ifconfig 2>/dev/null | grep -oE 'inet (192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})' | grep -oE '(192\.168\.[0-9]{1,3}\.[0-9]{1,3}|10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3})' | head -n 1)
fi

if [ -z "$HOST_IP" ]; then
    echo "❌ No se pudo detectar la IP del equipo"
    echo "   Usando localhost como fallback"
    HOST_IP="localhost"
fi

echo "   IP detectada: $HOST_IP"

# Verificar si ya existe .env.host y si la IP cambió
REBUILD_NEEDED=1
if [ -f .env.host ]; then
    if grep -q "HOST_IP=$HOST_IP" .env.host; then
        echo "   IP no ha cambiado, omitiendo rebuild..."
        REBUILD_NEEDED=0
    else
        echo "   IP cambió, rebuild necesario..."
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

# Detectar qué comando de Docker Compose está disponible
# Docker Compose V2 usa "docker compose" (con espacio)
# Docker Compose V1 usa "docker-compose" (con guión)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo "   Usando Docker Compose V2 (docker compose)"
elif docker-compose version &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo "   Usando Docker Compose V1 (docker-compose)"
else
    echo "❌ Error: Docker Compose no está instalado"
    echo "   Por favor, instala Docker Compose antes de continuar"
    exit 1
fi

# Detener servicios existentes y limpiar contenedores huérfanos
echo "   Deteniendo servicios existentes..."
$COMPOSE_CMD down

# Verificar y limpiar contenedores huérfanos que puedan estar usando los puertos
echo "   Verificando contenedores huérfanos..."
for container in track_io_backend track_io_nginx track_io_postgres; do
    if docker ps -a --filter "name=$container" --format "{{.Names}}" 2>/dev/null | grep -q "$container"; then
        echo "   Eliminando contenedor $container huérfano..."
        docker rm -f "$container" 2>/dev/null || true
    fi
done

# Verificar si el puerto 3000 está en uso
PORT_IN_USE=false
if command -v lsof >/dev/null 2>&1 && lsof -i :3000 >/dev/null 2>&1; then
    PORT_IN_USE=true
elif command -v netstat >/dev/null 2>&1 && netstat -tuln 2>/dev/null | grep -q ":3000 "; then
    PORT_IN_USE=true
elif command -v ss >/dev/null 2>&1 && ss -tuln 2>/dev/null | grep -q ":3000 "; then
    PORT_IN_USE=true
fi

if [ "$PORT_IN_USE" = true ]; then
    echo "   ⚠️  Advertencia: El puerto 3000 está en uso"
    echo "   Intentando liberar el puerto..."
    
    # Intentar detener cualquier contenedor usando el puerto 3000
    CONTAINERS_USING_PORT=$(docker ps --filter "publish=3000" --format "{{.ID}}" 2>/dev/null)
    if [ -n "$CONTAINERS_USING_PORT" ]; then
        echo "$CONTAINERS_USING_PORT" | while read -r container_id; do
            docker stop "$container_id" 2>/dev/null || true
            docker rm -f "$container_id" 2>/dev/null || true
        done
    fi
    
    # También buscar contenedores detenidos
    STOPPED_CONTAINERS=$(docker ps -a --filter "publish=3000" --format "{{.ID}}" 2>/dev/null)
    if [ -n "$STOPPED_CONTAINERS" ]; then
        echo "$STOPPED_CONTAINERS" | while read -r container_id; do
            docker rm -f "$container_id" 2>/dev/null || true
        done
    fi
    
    # Esperar un momento para que el puerto se libere
    sleep 2
    
    # Verificar nuevamente
    PORT_STILL_IN_USE=false
    if command -v lsof >/dev/null 2>&1 && lsof -i :3000 >/dev/null 2>&1; then
        PORT_STILL_IN_USE=true
    elif command -v netstat >/dev/null 2>&1 && netstat -tuln 2>/dev/null | grep -q ":3000 "; then
        PORT_STILL_IN_USE=true
    elif command -v ss >/dev/null 2>&1 && ss -tuln 2>/dev/null | grep -q ":3000 "; then
        PORT_STILL_IN_USE=true
    fi
    
    if [ "$PORT_STILL_IN_USE" = true ]; then
        echo "   ❌ El puerto 3000 aún está en uso"
        echo ""
        echo "   Soluciones:"
        echo "   1. Ver qué está usando el puerto:"
        echo "      sudo lsof -i :3000"
        echo "      sudo netstat -tuln | grep 3000"
        echo ""
        echo "   2. Detener contenedores manualmente:"
        echo "      docker ps -a | grep track_io"
        echo "      docker rm -f <container_id>"
        echo ""
        echo "   3. O cambiar el puerto en docker-compose.yml"
        exit 1
    else
        echo "   ✅ Puerto 3000 liberado correctamente"
    fi
fi

if [ $REBUILD_NEEDED -eq 1 ]; then
    echo "   Reconstruyendo servicios con nueva IP..."
    $COMPOSE_CMD --env-file .env.host up -d --build
else
    echo "   Iniciando servicios sin rebuild..."
    $COMPOSE_CMD --env-file .env.host up -d
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
echo "     Virtual Device:  http://localhost/virtual-device"
echo "     Backend API:     http://localhost:3000"
echo ""
echo "   [Acceso en Red Local]"
echo "     Dashboard:       http://$HOST_IP"
echo "     Virtual Device:  http://$HOST_IP/virtual-device"
echo "     Backend API:     http://$HOST_IP:3000"
echo ""
echo "💡 Otros equipos en la red pueden acceder usando la IP: $HOST_IP"
echo ""

