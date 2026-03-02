#!/bin/bash
# Track.IO - Iniciar entorno de Producción (Backend + Nginx)
# SQL Server debe estar corriendo por separado antes de ejecutar este script

set -e  # Salir si hay algún error

echo "========================================"
echo "🚀 Track.IO - Inicio de Producción"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Verificar que existe el archivo .env.production
if [ ! -f .env.production ]; then
    echo "❌ Error: No se encontró el archivo .env.production"
    echo ""
    echo "Por favor, crea el archivo .env.production basándote en .env.production.example:"
    echo "  cp .env.production.example .env.production"
    echo "  # Edita .env.production con tus configuraciones"
    echo ""
    exit 1
fi

# Verificar variables críticas
source .env.production

if [ -z "$MSSQL_SA_PASSWORD_PROD" ]; then
    echo "❌ Error: MSSQL_SA_PASSWORD_PROD no está configurada en .env.production"
    echo "   Esta variable es obligatoria para producción"
    exit 1
fi

# Verificar que SQL Server esté corriendo
echo "🔍 Verificando conexión a SQL Server..."
SQL_CONTAINER="track-io-sqlserver-prod"
if ! docker ps --format '{{.Names}}' | grep -q "^${SQL_CONTAINER}$"; then
    echo "❌ Error: El contenedor '$SQL_CONTAINER' no está corriendo"
    echo ""
    echo "   Inicia SQL Server primero con:"
    echo "   docker network create track_iq_production_sql_server 2>/dev/null; \\"
    echo "   docker run -d --name track-io-sqlserver-prod \\"
    echo "     --network track_iq_production_sql_server \\"
    echo "     --restart unless-stopped \\"
    echo "     -e 'ACCEPT_EULA=Y' \\"
    echo "     -e 'SA_PASSWORD=${MSSQL_SA_PASSWORD_PROD}' \\"
    echo "     -e 'MSSQL_PID=${MSSQL_PID:-Express}' \\"
    echo "     -p 0.0.0.0:${MSSQL_PORT_PROD:-1433}:1433 \\"
    echo "     -v sqlserver_prod_data:/var/opt/mssql \\"
    echo "     mcr.microsoft.com/mssql/server:2022-latest"
    echo ""
    exit 1
fi
echo "   ✅ SQL Server está corriendo"

echo ""
echo "🔍 Detectando IP del equipo..."

# Detectar la IP de la interfaz de red principal (activa, no virtual)
HOST_IP=$(ip -4 route show default 2>/dev/null | grep -oP 'src \K[\d.]+' | head -n 1)

if [ -z "$HOST_IP" ]; then
    DEFAULT_IFACE=$(ip -4 route show default 2>/dev/null | sed -n 's/.* dev \([^ ]*\).*/\1/p' | head -n 1)
    if [ -n "$DEFAULT_IFACE" ]; then
        HOST_IP=$(ip -4 addr show dev "$DEFAULT_IFACE" scope global 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    fi
fi

if [ -z "$HOST_IP" ]; then
    HOST_IP=$(ip -4 addr show scope global 2>/dev/null | grep -vE 'scope global.*(docker|br-|veth|virbr|lo)' | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
fi

if [ -z "$HOST_IP" ]; then
    HOST_IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -vE '^127\.|^169\.254\.' | head -n 1)
fi

if [ -z "$HOST_IP" ]; then
    echo "⚠️  No se pudo detectar la IP del equipo"
    echo "   Usando localhost como fallback"
    HOST_IP="localhost"
fi

echo "   IP detectada: $HOST_IP"

# Verificar si ya existe .env.host.prod para comparar configuración
REBUILD_NEEDED=1
OLD_IP=""
OLD_VITE_API_URL=""
OLD_CORS_ORIGIN=""
if [ -f .env.host.prod ]; then
    OLD_IP=$(grep "^HOST_IP=" .env.host.prod | cut -d'=' -f2 | tr -d '\n\r')
    OLD_VITE_API_URL=$(grep "^VITE_API_URL_PROD=" .env.host.prod | cut -d'=' -f2- | tr -d '\n\r')
    OLD_CORS_ORIGIN=$(grep "^CORS_ORIGIN_PROD=" .env.host.prod | cut -d'=' -f2- | tr -d '\n\r')
fi

echo ""
echo "📝 Configurando variables de entorno..."

# Leer CORS_ORIGIN_PROD de .env.production si existe
CUSTOM_CORS=""
if [ -f .env.production ]; then
    CUSTOM_CORS=$(grep "^CORS_ORIGIN_PROD=" .env.production | cut -d'=' -f2 | tr -d '\n\r' | sed 's/"//g')
fi

# Si hay CORS personalizado y no es "*", combinarlo con los orígenes locales
if [ -n "$CUSTOM_CORS" ] && [ "$CUSTOM_CORS" != "*" ]; then
    CORS_ORIGIN="http://localhost:${NGINX_PORT_PROD:-80},http://$HOST_IP:${NGINX_PORT_PROD:-80},$CUSTOM_CORS"
else
    CORS_ORIGIN="http://localhost:${NGINX_PORT_PROD:-80},http://$HOST_IP:${NGINX_PORT_PROD:-80}"
fi

DESIRED_VITE_API_URL="http://$HOST_IP:${BACKEND_PORT_PROD:-3000}"

# Determinar si es necesario rebuild según cambios detectados
if [ -f .env.host.prod ]; then
    if [ "$OLD_IP" = "$HOST_IP" ] && \
       [ "$OLD_VITE_API_URL" = "$DESIRED_VITE_API_URL" ] && \
       [ "$OLD_CORS_ORIGIN" = "$CORS_ORIGIN" ]; then
        echo "   Configuración no ha cambiado, omitiendo rebuild..."
        REBUILD_NEEDED=0
    else
        echo "   Configuración cambió, rebuild necesario..."
    fi
else
    echo "   Primera ejecución, generando configuración..."
fi

cat > .env.host.prod << EOF
HOST_IP=$HOST_IP
VITE_API_URL_PROD=$DESIRED_VITE_API_URL
CORS_ORIGIN_PROD=$CORS_ORIGIN
EOF

echo "   CORS_ORIGIN configurado: $CORS_ORIGIN"

echo ""
echo "🐳 Deteniendo contenedores existentes..."
docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod down

echo ""
if [ $REBUILD_NEEDED -eq 1 ]; then
    echo "🔨 Reconstruyendo servicios con nueva IP..."
    if [ "${FORCE_LEGACY_DOCKER_BUILD:-}" = "1" ]; then
        export DOCKER_BUILDKIT=0
        export COMPOSE_DOCKER_CLI_BUILD=0
    fi

    BUILD_ATTEMPTS=${BUILD_ATTEMPTS:-3}
    BUILD_SLEEP=${BUILD_SLEEP:-5}
    BUILD_OK=0
    for i in $(seq 1 "$BUILD_ATTEMPTS"); do
        if docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod build --no-cache nginx_prod; then
            BUILD_OK=1
            break
        fi
        if [ "$i" -lt "$BUILD_ATTEMPTS" ]; then
            echo "   ⚠️  Fallo en build (intento $i). Reintentando en ${BUILD_SLEEP}s..."
            sleep "$BUILD_SLEEP"
        fi
    done
    if [ "$BUILD_OK" -ne 1 ]; then
        echo "❌ Falló el build de nginx_prod tras $BUILD_ATTEMPTS intentos."
        echo "   Posible problema de DNS/red. Revisa la conectividad a registry.npmjs.org"
        exit 1
    fi
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod up -d --build
else
    echo "▶️  Iniciando servicios sin rebuild..."
    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod up -d
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al iniciar los servicios"
    echo "   Revisa los logs: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo "========================================"
echo "✅ Entorno de Producción iniciado!"
echo "========================================"
echo ""
echo "🌐 URLs de acceso:"
echo "   [Acceso Local]"
echo "     Dashboard:       http://localhost:${NGINX_PORT_PROD:-80}"
echo "     Backend API:     http://localhost:${BACKEND_PORT_PROD:-3000}"
echo "     SQL Server:      localhost:${MSSQL_PORT_PROD:-1433}"
echo ""
echo "   [Acceso en Red]"
echo "     Dashboard:       http://$HOST_IP:${NGINX_PORT_PROD:-80}"
echo "     Backend API:     http://$HOST_IP:${BACKEND_PORT_PROD:-3000}"
echo "     SQL Server:      $HOST_IP:${MSSQL_PORT_PROD:-1433}"
echo ""
echo "📊 Servicios:"
echo "   - SQL Server 2022 (${MSSQL_PID:-Express}) [contenedor independiente]"
echo "   - Backend NestJS (Node.js)"
echo "   - Nginx (Reverse Proxy)"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:          docker compose -f docker-compose.prod.yml logs -f"
echo "   Ver estado:        docker compose -f docker-compose.prod.yml ps"
echo "   Detener:           ./stop-prod.sh"
echo ""
