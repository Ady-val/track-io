# Track.IO - Guía de Producción con SQL Server

Guía completa para desplegar Track.IO en producción usando Microsoft SQL Server 2022 con Docker.

---

## 📋 Índice

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación Inicial](#instalación-inicial)
3. [Configuración](#configuración)
4. [Despliegue](#despliegue)
5. [Gestión y Mantenimiento](#gestión-y-mantenimiento)
6. [Seguridad](#seguridad)
7. [Backups](#backups)
8. [Monitoreo](#monitoreo)
9. [Solución de Problemas](#solución-de-problemas)

---

## 📋 Requisitos Previos

### Servidor

- **Sistema Operativo**: Linux (Ubuntu 20.04+ recomendado), Windows Server 2019+, o macOS
- **RAM**: Mínimo 4GB (8GB+ recomendado para producción)
- **CPU**: 2+ cores (4+ cores recomendado)
- **Disco**: 20GB+ espacio libre (50GB+ recomendado)
- **Red**: Acceso a internet para descargar imágenes Docker

### Software

- **Docker**: 20.10+
- **Docker Compose**: 2.0+ (incluido en Docker Desktop)
- **Git**: Para clonar el repositorio

---

## 🔧 Instalación Inicial

### Paso 1: Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd track-io/docker/sql-server-version
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.production.example .env.production

# Editar con tus configuraciones
nano .env.production  # Linux/Mac
# o
notepad .env.production  # Windows
```

**⚠️ IMPORTANTE**: Configura las siguientes variables críticas:

```bash
# Contraseña segura para SQL Server (OBLIGATORIO)
MSSQL_SA_PASSWORD_PROD=TuPasswordSeguro123!@#

# Nombre de la base de datos
MSSQL_DB_PROD=track_io_prod

# Edición de SQL Server (Express, Developer, Standard, Enterprise)
MSSQL_PID=Express  # Para producción gratuita, o Standard/Enterprise para producción empresarial
```

### Paso 3: Verificar Permisos (Linux/Mac)

```bash
chmod +x start-prod.sh
chmod +x stop-prod.sh
```

---

## ⚙️ Configuración

### Variables de Entorno Críticas

| Variable                              | Descripción                          | Valor Recomendado                                                     |
| ------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| `MSSQL_SA_PASSWORD_PROD`              | Contraseña del usuario SA            | Mínimo 8 caracteres, compleja                                         |
| `MSSQL_DB_PROD`                       | Nombre de la base de datos           | `track_io_prod`                                                       |
| `MSSQL_PID`                           | Edición de SQL Server                | `Express` (gratis) o `Standard`/`Enterprise`                          |
| `MSSQL_ENCRYPT_PROD`                  | Habilitar SSL                        | `true` (producción)                                                   |
| `MSSQL_TRUST_SERVER_CERTIFICATE_PROD` | Confiar en certificados autofirmados | `false` (producción)                                                  |
| `BACKEND_PORT_PROD`                   | Puerto del backend                   | `3000`                                                                |
| `NGINX_PORT_PROD`                     | Puerto HTTP                          | `80`                                                                  |
| `NGINX_SSL_PORT_PROD`                 | Puerto HTTPS                         | `443`                                                                 |
| `CORS_ORIGIN_PROD`                    | Orígenes permitidos CORS (opcional)  | Si no se especifica, se detecta automáticamente: localhost + IP local |

### Configuración de CORS

Los scripts de inicio detectan automáticamente la IP del servidor y configuran CORS para permitir acceso desde:

- **Localhost**: `http://localhost:80` (acceso desde el mismo servidor)
- **IP Local**: `http://[IP_SERVIDOR]:80` (acceso desde cualquier dispositivo en la red local)

Si necesitas agregar orígenes adicionales (dominios personalizados), configura `CORS_ORIGIN_PROD` en `.env.production`:

```bash
# Ejemplo: agregar dominios personalizados
CORS_ORIGIN_PROD=http://mi-dominio.com,https://mi-dominio.com
```

Los scripts combinarán automáticamente estos valores con los orígenes locales detectados.

### Configuración de Puertos

En producción, puedes cambiar los puertos para mayor seguridad:

```bash
# En .env.production
MSSQL_PORT_PROD=1433
BACKEND_PORT_PROD=3000
NGINX_PORT_PROD=80
NGINX_SSL_PORT_PROD=443
```

### Configuración SSL/HTTPS

Para habilitar HTTPS en producción:

1. **Obtener certificados SSL**:

   - Usa Let's Encrypt (gratis): `certbot`
   - O usa certificados comerciales

2. **Colocar certificados**:

   ```bash
   mkdir -p nginx/ssl
   # Copiar certificado y clave privada
   cp tu-certificado.crt nginx/ssl/
   cp tu-clave-privada.key nginx/ssl/
   ```

3. **Configurar Nginx**:
   - Edita `nginx/nginx.prod.conf` para incluir configuración SSL

---

## 🚀 Despliegue

### Iniciar el Sistema en Producción

**Linux/Mac:**

```bash
./start-prod.sh
```

**Windows:**

```batch
start-prod.bat
```

El script automáticamente:

- ✅ Verifica que `.env.production` existe
- ✅ Detecta la IP del servidor
- ✅ Inicia todos los servicios
- ✅ Verifica el estado de los servicios

### Verificar Estado

```bash
# Ver estado de los contenedores
docker compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker compose -f docker-compose.prod.yml logs -f backend_prod
docker compose -f docker-compose.prod.yml logs -f track_io_sql_server_prod
docker compose -f docker-compose.prod.yml logs -f nginx_prod
```

### Detener el Sistema

**Linux/Mac:**

```bash
./stop-prod.sh
```

**Windows:**

```batch
stop-prod.bat
```

---

## 🔄 Gestión y Mantenimiento

### Ejecutar Migraciones

Las migraciones deben ejecutarse manualmente en producción:

```bash
# Conectarse al contenedor del backend
docker compose -f docker-compose.prod.yml exec backend_prod sh

# Ejecutar migraciones
npm run migration:run

# Ver estado de migraciones
npm run migration:show
```

### Actualizar el Sistema

Cuando hay actualizaciones:

```bash
# 1. Hacer backup de la base de datos (ver sección Backups)

# 2. Detener servicios
./stop-prod.sh

# 3. Actualizar código
git pull

# 4. Reconstruir e iniciar
./start-prod.sh
```

### Reiniciar un Servicio Específico

```bash
# Reiniciar solo el backend
docker compose -f docker-compose.prod.yml restart backend_prod

# Reiniciar solo Nginx
docker compose -f docker-compose.prod.yml restart nginx_prod

# Reiniciar SQL Server (cuidado, puede afectar conexiones)
docker compose -f docker-compose.prod.yml restart track_io_sql_server_prod
```

---

## 🔒 Seguridad

### Recomendaciones de Seguridad

1. **Contraseñas Fuertes**:

   - Usa contraseñas complejas de al menos 16 caracteres
   - No commitees `.env.production` al repositorio

2. **Firewall**:

   ```bash
   # Solo permitir puertos necesarios
   # Puerto 80 (HTTP)
   # Puerto 443 (HTTPS)
   # Bloquear puerto 1433 (SQL Server) desde internet
   ```

3. **Certificados SSL**:

   - Usa certificados válidos para HTTPS
   - Configura redirección HTTP → HTTPS

4. **Variables de Entorno**:

   - Usa secretos de Docker o gestores de secretos
   - No expongas variables sensibles en logs

5. **Actualizaciones**:
   - Mantén Docker y las imágenes actualizadas
   - Aplica parches de seguridad regularmente

### Configurar Firewall

#### Ubuntu/Linux

```bash
# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquear SQL Server desde internet (solo acceso local)
sudo ufw deny 1433/tcp

# Habilitar firewall
sudo ufw enable
```

#### Windows

Si no puedes acceder a la aplicación desde otros dispositivos en tu red WiFi (como tu celular), el **Firewall de Windows** puede estar bloqueando las conexiones entrantes.

**Opción 1: Usando PowerShell (Como Administrador)**

```powershell
# Permitir puerto 80 (HTTP - Nginx)
New-NetFirewallRule -DisplayName "Track.IO HTTP (80)" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Permitir puerto 3000 (Backend API)
New-NetFirewallRule -DisplayName "Track.IO Backend (3000)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Opcional: Permitir puerto 1433 (SQL Server - solo si necesitas acceso directo)
New-NetFirewallRule -DisplayName "Track.IO SQL Server (1433)" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
```

**Opción 2: Usando CMD (Como Administrador)**

```cmd
netsh advfirewall firewall add rule name="Track.IO HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Track.IO Backend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Track.IO SQL Server" dir=in action=allow protocol=TCP localport=1433
```

**Verificar reglas creadas:**

```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -match "Track.IO"} | Select-Object DisplayName, Enabled, Direction, Action
```

**Nota:** Las reglas de firewall se guardan y persisten después de reiniciar Windows.

---

## 💾 Backups

### Backup Manual de Base de Datos

```bash
# Crear directorio de backups
mkdir -p backups

# Ejecutar backup
docker compose -f docker-compose.prod.yml exec track_io_sql_server_prod \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost \
  -U sa \
  -P "${MSSQL_SA_PASSWORD_PROD}" \
  -Q "BACKUP DATABASE [track_io_prod] TO DISK = '/var/opt/mssql/backup/track_io_prod_$(date +%Y%m%d_%H%M%S).bak'"
```

### Backup Automático con Cron (Linux)

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * cd /ruta/a/track-io/docker/sql-server-version && ./backup-db.sh
```

Crear script `backup-db.sh`:

```bash
#!/bin/bash
BACKUP_FILE="backups/track_io_prod_$(date +%Y%m%d_%H%M%S).bak"
docker compose -f docker-compose.prod.yml exec -T track_io_sql_server_prod \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "${MSSQL_SA_PASSWORD_PROD}" \
  -Q "BACKUP DATABASE [track_io_prod] TO DISK = '/var/opt/mssql/backup/$(basename $BACKUP_FILE)'"

# Mantener solo los últimos 30 días
find backups/ -name "*.bak" -mtime +30 -delete
```

### Restaurar Backup

```bash
# Copiar archivo de backup al contenedor
docker cp backups/tu_backup.bak track-io-sqlserver-prod:/var/opt/mssql/backup/

# Restaurar
docker compose -f docker-compose.prod.yml exec track_io_sql_server_prod \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "${MSSQL_SA_PASSWORD_PROD}" \
  -Q "RESTORE DATABASE [track_io_prod] FROM DISK = '/var/opt/mssql/backup/tu_backup.bak' WITH REPLACE"
```

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Solo errores
docker compose -f docker-compose.prod.yml logs --tail=100 | grep -i error

# Solo SQL Server
docker compose -f docker-compose.prod.yml logs -f track_io_sql_server_prod
```

### Verificar Estado de Servicios

```bash
# Estado general
docker compose -f docker-compose.prod.yml ps

# Recursos utilizados
docker stats

# Espacio en disco
docker system df
```

### Health Checks

Los servicios tienen health checks configurados:

```bash
# Ver estado de health checks
docker compose -f docker-compose.prod.yml ps
```

---

## 🚨 Solución de Problemas

### El Sistema No Inicia

```bash
# Ver logs de errores
docker compose -f docker-compose.prod.yml logs

# Verificar que .env.production existe
ls -la .env.production

# Verificar variables críticas
grep MSSQL_SA_PASSWORD_PROD .env.production
```

### SQL Server No Conecta

```bash
# Ver logs de SQL Server
docker compose -f docker-compose.prod.yml logs track_io_sql_server_prod

# Verificar que está corriendo
docker compose -f docker-compose.prod.yml ps track_io_sql_server_prod

# Probar conexión manual
docker compose -f docker-compose.prod.yml exec track_io_sql_server_prod \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "${MSSQL_SA_PASSWORD_PROD}" \
  -Q "SELECT @@VERSION"
```

### Backend No Inicia

```bash
# Ver logs del backend
docker compose -f docker-compose.prod.yml logs backend_prod

# Verificar variables de entorno
docker compose -f docker-compose.prod.yml exec backend_prod env | grep DATABASE

# Verificar conexión a SQL Server
docker compose -f docker-compose.prod.yml exec backend_prod sh
# Dentro del contenedor:
npm run migration:show
```

### Nginx No Responde

```bash
# Ver logs de Nginx
docker compose -f docker-compose.prod.yml logs nginx_prod

# Verificar configuración
docker compose -f docker-compose.prod.yml exec nginx_prod nginx -t

# Verificar que backend está accesible
docker compose -f docker-compose.prod.yml exec nginx_prod wget -O- http://backend_prod:3000
```

### Problemas de Espacio en Disco

```bash
# Ver uso de espacio
docker system df

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volúmenes no usados (CUIDADO: elimina datos)
docker volume prune
```

---

## 📝 Notas Importantes

- **Grupo de contenedores**: `track_iq_production_sql_server`
- **Volumen de datos**: `track_iq_production_sqlserver_data`
- **Red**: `track_iq_production_sql_server`

### Primera Ejecución

- La primera ejecución puede tardar 10-20 minutos mientras descarga imágenes
- SQL Server tarda 30-60 segundos en inicializarse completamente
- El backend espera a que SQL Server esté listo antes de conectarse

### Reinicio Automático

Los contenedores están configurados con `restart: unless-stopped`, por lo que se reiniciarán automáticamente si el servidor se reinicia.

---

## 🆘 Soporte

Para más información:

1. Revisa los logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Verifica el estado: `docker compose -f docker-compose.prod.yml ps`
3. Consulta la documentación principal: `README.md`
4. Revisa los issues en el repositorio

---

**Última actualización**: 2026-01-10
