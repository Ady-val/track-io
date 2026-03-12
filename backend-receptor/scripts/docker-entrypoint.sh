#!/bin/sh
# Escribe variables de entorno a .env para que ormconfig/TypeORM las use correctamente
# (evita problemas cuando el proceso hijo no hereda el entorno de Docker)
: > /app/.env
[ -n "$DATABASE_TYPE" ] && echo "DATABASE_TYPE=$DATABASE_TYPE" >> /app/.env
[ -n "$DATABASE_HOST" ] && echo "DATABASE_HOST=$DATABASE_HOST" >> /app/.env
[ -n "$DATABASE_PORT" ] && echo "DATABASE_PORT=$DATABASE_PORT" >> /app/.env
[ -n "$DATABASE_USERNAME" ] && echo "DATABASE_USERNAME=$DATABASE_USERNAME" >> /app/.env
[ -n "$DATABASE_PASSWORD" ] && echo "DATABASE_PASSWORD=$DATABASE_PASSWORD" >> /app/.env
[ -n "$DATABASE_NAME" ] && echo "DATABASE_NAME=$DATABASE_NAME" >> /app/.env
[ -n "$NODE_ENV" ] && echo "NODE_ENV=$NODE_ENV" >> /app/.env
exec "$@"
