#!/bin/bash
# Track.IO - Iniciar entorno de Producción con SQL Server
# Este script inicia todos los servicios en modo producción

set -e  # Salir si hay algún error

# Parsear argumentos
CLEAN_MODE=0
for arg in "$@"; do
    case "$arg" in
        --clean)
            CLEAN_MODE=1
            ;;
    esac
done

echo "========================================"
echo "🚀 Track.IO - Inicio de Producción (SQL Server)"
if [ $CLEAN_MODE -eq 1 ]; then
    echo "   ⚠️  Modo limpio: se eliminará toda la data de BD"
fi
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

echo "🔍 Detectando IP del equipo..."

# Detectar la IP de la interfaz de red principal (activa, no virtual)
# Usa la IP de la ruta por defecto, que es la interfaz de red principal activa
HOST_IP=$(ip -4 route show default 2>/dev/null | grep -oP 'src \K[\d.]+' | head -n 1)

# Si no se encuentra usando la ruta por defecto, intentar desde la interfaz de la ruta por defecto
if [ -z "$HOST_IP" ]; then
    DEFAULT_IFACE=$(ip -4 route show default 2>/dev/null | sed -n 's/.* dev \([^ ]*\).*/\1/p' | head -n 1)
    if [ -n "$DEFAULT_IFACE" ]; then
        HOST_IP=$(ip -4 addr show dev "$DEFAULT_IFACE" scope global 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    fi
fi

# Si no se encuentra usando la ruta por defecto, intentar obtener de interfaces globales (excluyendo virtuales)
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(ip -4 addr show scope global 2>/dev/null | grep -vE 'scope global.*(docker|br-|veth|virbr|lo)' | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
fi

# Si aún no se encuentra, usar hostname -I pero filtrar IPs de localhost/link-local
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
    # Combinar localhost, IP local y orígenes personalizados
    CORS_ORIGIN="http://localhost:${NGINX_PORT_PROD:-80},http://$HOST_IP:${NGINX_PORT_PROD:-80},$CUSTOM_CORS"
else
    # Por defecto: incluir localhost e IP local para permitir acceso desde cualquier dispositivo en la red local
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
if [ $CLEAN_MODE -eq 1 ]; then
    echo "   🗑️  Eliminando volúmenes de datos (--clean)..."
    docker compose -f docker-compose.prod.yml --profile internal-db --env-file .env.production --env-file .env.host.prod down --volumes
    REBUILD_NEEDED=1
else
    docker compose -f docker-compose.prod.yml --profile internal-db --env-file .env.production --env-file .env.host.prod down
fi

echo ""
if [ $REBUILD_NEEDED -eq 1 ]; then
    echo "🔨 Reconstruyendo servicios con nueva IP..."
    # Opcional: usar builder legacy si BuildKit causa problemas de red
    if [ "${FORCE_LEGACY_DOCKER_BUILD:-}" = "1" ]; then
        export DOCKER_BUILDKIT=0
        export COMPOSE_DOCKER_CLI_BUILD=0
    fi

    # Reintentos para mitigar fallos DNS intermitentes (EAI_AGAIN)
    BUILD_ATTEMPTS=${BUILD_ATTEMPTS:-3}
    BUILD_SLEEP=${BUILD_SLEEP:-5}
    BUILD_OK=0
    for i in $(seq 1 "$BUILD_ATTEMPTS"); do
        if docker compose -f docker-compose.prod.yml --profile internal-db --env-file .env.production --env-file .env.host.prod build --no-cache nginx_prod; then
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
    docker compose -f docker-compose.prod.yml --profile internal-db --env-file .env.production --env-file .env.host.prod up -d --build
else
    echo "▶️  Iniciando servicios sin rebuild..."
    docker compose -f docker-compose.prod.yml --profile internal-db --env-file .env.production --env-file .env.host.prod up -d
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error al iniciar los servicios"
    echo "   Revisa los logs: docker compose -f docker-compose.prod.yml logs"
    exit 1
fi

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 15

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
echo "   - SQL Server 2022 (${MSSQL_PID:-Express})"
echo "   - Backend NestJS (Node.js)"
echo "   - Nginx (Reverse Proxy)"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:          docker compose -f docker-compose.prod.yml logs -f"
echo "   Ver estado:        docker compose -f docker-compose.prod.yml ps"
echo "   Detener:           ./stop-prod.sh"
echo "   Reinicio limpio:   ./start-prod.sh --clean  (elimina BD y recrea todo)"
echo ""
