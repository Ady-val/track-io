# Guia rapida: iniciar produccion (Linux)

Este archivo explica como entrar al directorio correcto y ejecutar `start-prod.sh`
sin usar `chmod`, y que variables cambiar si el backend debe apuntar a otra base
de datos.

## 1) Ir al path correcto

Si tu repo esta en `/projects/track-io`, entra asi:

```
cd /projects/track-io/docker/sql-server-version
```

> Nota: el path correcto es `sql-server-version` (no `slq-server-version`).

## 2) Ejecutar start-prod.sh sin chmod

No necesitas `chmod +x` si lo ejecutas con `bash`:

```
bash start-prod.sh
```

Si falla, puedes probar con:

```
sh start-prod.sh
```

## 3) Abrir y editar .env.production

Para abrir el archivo en Linux con nano:

```
nano .env.production
```

Si el archivo no existe, crealo desde la plantilla:

```
cp env.production.template .env.production
nano .env.production
```

## 4) Variables para apuntar el backend a otra BD

Edita `.env.production` y ajusta estas variables:

- `DATABASE_HOST_PROD`: IP o dominio del servidor de BD externo.
- `MSSQL_PORT_PROD`: puerto de SQL Server (default `1433`).
- `MSSQL_USER_PROD`: usuario (default `sa`).
- `MSSQL_SA_PASSWORD_PROD`: password del usuario.
- `MSSQL_DB_PROD`: nombre de la base de datos.
- `MSSQL_ENCRYPT_PROD`: `true/false` segun tu configuracion TLS.
- `MSSQL_TRUST_SERVER_CERTIFICATE_PROD`: `true/false` si usas certificado propio.

Con eso, el backend usara esa base de datos externa al levantar el entorno.
