#!/bin/bash
# Track.IO - Script unificado para gestionar entornos Docker (SQL Server)
# Uso: ./run.sh [db-init|dev|test|prod|down]

set -e

cd "$(dirname "$0")"

show_help() {
    echo "========================================"
    echo "Track.IO - Comandos disponibles"
    echo "========================================"
    echo ""
    echo "  ./run.sh db-init              Crea red y contenedor SQL Server (requerido antes de prod)"
    echo "  ./run.sh dev                  Levanta entorno de desarrollo"
    echo "  ./run.sh test                 Levanta entorno de testing"
    echo "  ./run.sh prod                 Levanta produccion (requiere db-init previo)"
    echo "  ./run.sh down [dev|test|prod] Detiene el entorno indicado"
    echo ""
    echo "Ejemplos:"
    echo "  ./run.sh db-init"
    echo "  ./run.sh prod"
    echo "  ./run.sh down prod"
    echo ""
}

do_db_init() {
    echo ""
    echo "[db-init] Creando base de datos SQL Server para produccion..."
    echo ""

    if [ ! -f .env.production ]; then
        echo "Error: No se encontro .env.production"
        echo "  cp env.production.template .env.production"
        echo "  Edita .env.production con MSSQL_SA_PASSWORD_PROD"
        exit 1
    fi

    source .env.production
    MSSQL_SA_PASSWORD_PROD="${MSSQL_SA_PASSWORD_PROD:?MSSQL_SA_PASSWORD_PROD no esta definida en .env.production}"
    MSSQL_PID="${MSSQL_PID:-Express}"
    MSSQL_PORT_PROD="${MSSQL_PORT_PROD:-1434}"

    echo "Creando red Docker..."
    docker network create track_iq_production_sql_server 2>/dev/null || true

    if docker ps -a --format '{{.Names}}' | grep -q "^track-io-sqlserver-prod$"; then
        if docker ps --format '{{.Names}}' | grep -q "^track-io-sqlserver-prod$"; then
            echo "SQL Server ya esta corriendo."
        else
            echo "Iniciando contenedor existente..."
            docker start track-io-sqlserver-prod
        fi
    else
        echo "Creando contenedor SQL Server..."
        docker run -d --name track-io-sqlserver-prod \
            --network track_iq_production_sql_server \
            --restart unless-stopped \
            -e ACCEPT_EULA=Y \
            -e "MSSQL_SA_PASSWORD=${MSSQL_SA_PASSWORD_PROD}" \
            -e "MSSQL_PID=${MSSQL_PID}" \
            -p "${MSSQL_PORT_PROD}:1433" \
            -v sqlserver_prod_data:/var/opt/mssql \
            mcr.microsoft.com/mssql/server:2022-latest
    fi

    echo "Esperando a que SQL Server acepte conexiones..."
    for i in $(seq 1 12); do
        if docker exec track-io-sqlserver-prod /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "${MSSQL_SA_PASSWORD_PROD}" -Q "SELECT 1" -C >/dev/null 2>&1; then
            echo "SQL Server listo."
            exit 0
        fi
        [ "$i" -lt 12 ] && sleep 5
    done
    echo "Error: SQL Server no respondio en 60 segundos"
    exit 1
}

detect_host_ip() {
    HOST_IP=$(ip -4 route show default 2>/dev/null | grep -oP 'src \K[\d.]+' | head -n 1)
    if [ -z "$HOST_IP" ]; then
        DEFAULT_IFACE=$(ip -4 route show default 2>/dev/null | sed -n 's/.* dev \([^ ]*\).*/\1/p' | head -n 1)
        [ -n "$DEFAULT_IFACE" ] && HOST_IP=$(ip -4 addr show dev "$DEFAULT_IFACE" scope global 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    fi
    if [ -z "$HOST_IP" ]; then
        HOST_IP=$(ip -4 addr show scope global 2>/dev/null | grep -vE 'scope global.*(docker|br-|veth|virbr|lo)' | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n 1)
    fi
    if [ -z "$HOST_IP" ]; then
        HOST_IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -vE '^127\.|^169\.254\.' | head -n 1)
    fi
    HOST_IP="${HOST_IP:-localhost}"
    echo "IP detectada: $HOST_IP"
}

do_dev() {
    echo ""
    echo "[dev] Iniciando entorno de desarrollo..."
    echo ""

    [ ! -f .env ] && [ -f env.example ] && cp env.example .env

    detect_host_ip

    REBUILD_NEEDED=1
    if [ -f .env.host ]; then
        OLD_IP=$(grep "^HOST_IP=" .env.host | cut -d'=' -f2 | tr -d '\n\r')
        [ "$OLD_IP" = "$HOST_IP" ] && REBUILD_NEEDED=0
    fi

    cat > .env.host << EOF
HOST_IP=$HOST_IP
VITE_API_URL=http://$HOST_IP:3000
EOF

    docker compose -f docker-compose.yml --env-file .env down -v 2>/dev/null || true
    if [ "$REBUILD_NEEDED" -eq 1 ]; then
        docker compose -f docker-compose.yml --env-file .env --env-file .env.host build --no-cache nginx
        docker compose -f docker-compose.yml --env-file .env --env-file .env.host up -d --build
    else
        docker compose -f docker-compose.yml --env-file .env --env-file .env.host up -d
    fi
    echo ""
    echo "Desarrollo iniciado. Dashboard: http://localhost:80  Virtual Device: http://localhost/virtual-device/  Backend: http://localhost:3000"
}

do_test() {
    echo ""
    echo "[test] Iniciando entorno de testing..."
    echo ""
    docker compose -f docker-compose.test.yml down 2>/dev/null || true
    docker compose -f docker-compose.test.yml up -d --build
    sleep 10
    echo ""
    echo "Testing iniciado. Backend: http://localhost:3001  SQL Server: localhost:1435"
}

do_prod() {
    echo ""
    echo "[prod] Iniciando entorno de produccion..."
    echo ""

    if [ ! -f .env.production ]; then
        echo "Error: No se encontro .env.production"
        echo "  cp env.production.template .env.production"
        exit 1
    fi

    source .env.production
    if ! docker ps --format '{{.Names}}' | grep -q "^track-io-sqlserver-prod$"; then
        echo "Error: SQL Server no esta corriendo. Ejecuta primero: ./run.sh db-init"
        exit 1
    fi

    detect_host_ip
    docker network create track_iq_production_sql_server 2>/dev/null || true

    CUSTOM_CORS=$(grep "^CORS_ORIGIN_PROD=" .env.production 2>/dev/null | cut -d'=' -f2 | tr -d '\n\r' | sed 's/"//g')
    if [ -n "$CUSTOM_CORS" ] && [ "$CUSTOM_CORS" != "*" ]; then
        CORS_ORIGIN="http://localhost:${NGINX_PORT_PROD:-80},http://$HOST_IP:${NGINX_PORT_PROD:-80},$CUSTOM_CORS"
    else
        CORS_ORIGIN="http://localhost:${NGINX_PORT_PROD:-80},http://$HOST_IP:${NGINX_PORT_PROD:-80}"
    fi

    REBUILD_NEEDED=1
    DESIRED_VITE="http://$HOST_IP:${BACKEND_PORT_PROD:-3000}"
    if [ -f .env.host.prod ]; then
        OLD_IP=$(grep "^HOST_IP=" .env.host.prod | cut -d'=' -f2 | tr -d '\n\r')
        OLD_VITE=$(grep "^VITE_API_URL_PROD=" .env.host.prod | cut -d'=' -f2- | tr -d '\n\r')
        OLD_CORS=$(grep "^CORS_ORIGIN_PROD=" .env.host.prod | cut -d'=' -f2- | tr -d '\n\r')
        if [ "$OLD_IP" = "$HOST_IP" ] && [ "$OLD_VITE" = "$DESIRED_VITE" ] && [ "$OLD_CORS" = "$CORS_ORIGIN" ]; then
            REBUILD_NEEDED=0
        fi
    fi

    cat > .env.host.prod << EOF
HOST_IP=$HOST_IP
VITE_API_URL_PROD=$DESIRED_VITE
CORS_ORIGIN_PROD=$CORS_ORIGIN
EOF

    docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod down 2>/dev/null || true
    if [ "$REBUILD_NEEDED" -eq 1 ]; then
        docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod build --no-cache nginx_prod
        docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod up -d --build
    else
        docker compose -f docker-compose.prod.yml --env-file .env.production --env-file .env.host.prod up -d
    fi
    sleep 15
    echo ""
    echo "Produccion iniciada. Dashboard: http://localhost:80  Virtual Device: http://localhost/virtual-device/  Backend: http://localhost:3000"
}

do_down() {
    local env="${1:-dev}"
    echo ""
    case "$env" in
        prod)
            echo "[down] Deteniendo produccion..."
            if [ -f .env.production ]; then
                docker compose -f docker-compose.prod.yml --env-file .env.production down
            else
                docker compose -f docker-compose.prod.yml down
            fi
            ;;
        test)
            echo "[down] Deteniendo testing..."
            docker compose -f docker-compose.test.yml down
            ;;
        *)
            echo "[down] Deteniendo desarrollo..."
            docker compose -f docker-compose.yml --env-file .env down
            ;;
    esac
    echo "Listo."
}

# --- Main ---
CMD="${1:-}"
case "$CMD" in
    ""|help)
        show_help
        exit 0
        ;;
    db-init)
        do_db_init
        ;;
    dev)
        do_dev
        ;;
    test)
        do_test
        ;;
    prod)
        do_prod
        ;;
    down)
        do_down "${2:-dev}"
        ;;
    *)
        echo "Comando desconocido: $CMD"
        show_help
        exit 1
        ;;
esac
