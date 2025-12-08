# 🔧 Solución de Problemas: Puertos en Uso

## ❌ Error: "port is already allocated"

Este error significa que el puerto que Docker intenta usar ya está siendo utilizado por otro proceso o contenedor.

---

## 🔍 Diagnóstico Rápido

### Verificar qué está usando el puerto 3000

**En Linux/Debian:**

```bash
# Opción 1: Usando lsof (si está instalado)
sudo lsof -i :3000

# Opción 2: Usando netstat
sudo netstat -tuln | grep :3000

# Opción 3: Usando ss (más moderno)
sudo ss -tuln | grep :3000

# Opción 4: Ver contenedores Docker usando el puerto
docker ps --filter "publish=3000"
```

**En Windows:**

```powershell
# Ver qué está usando el puerto 3000
netstat -ano | findstr :3000
```

---

## ✅ Soluciones

### Solución 1: Detener Contenedores Huérfanos (Más Común)

Si hay contenedores Docker anteriores que no se detuvieron correctamente:

```bash
# Ver todos los contenedores (activos e inactivos)
docker ps -a

# Detener y eliminar contenedores específicos
docker stop track_io_backend track_io_nginx track_io_postgres
docker rm track_io_backend track_io_nginx track_io_postgres

# O detener todos los contenedores de Track.IO
docker ps -a | grep track_io | awk '{print $1}' | xargs docker rm -f
```

### Solución 2: Usar Docker Compose para Limpiar

```bash
# Detener todos los servicios
docker compose down

# O si tienes V1
docker-compose down

# Forzar eliminación de contenedores
docker compose down --remove-orphans
```

### Solución 3: Detener Proceso Local

Si el puerto está siendo usado por un proceso local (no Docker):

**En Linux/Debian:**

```bash
# 1. Encontrar el PID del proceso
sudo lsof -i :3000
# O
sudo netstat -tulpn | grep :3000

# 2. Detener el proceso (reemplaza PID con el número que encontraste)
sudo kill -9 <PID>

# Ejemplo:
# sudo kill -9 12345
```

**En Windows:**

```powershell
# 1. Encontrar el PID
netstat -ano | findstr :3000

# 2. Detener el proceso (reemplaza PID con el número)
taskkill /PID <PID> /F

# Ejemplo:
# taskkill /PID 12345 /F
```

### Solución 4: Cambiar el Puerto en Docker Compose

Si no puedes liberar el puerto, puedes cambiarlo temporalmente:

1. Edita `docker-compose.yml`:

```yaml
backend:
  ports:
    - "0.0.0.0:3001:3000"  # Cambia 3000 a 3001 (o cualquier otro puerto libre)
```

2. Actualiza `.env.host` o la variable `VITE_API_URL`:

```bash
# Edita .env.host y cambia:
VITE_API_URL=http://TU_IP:3001
```

3. Reconstruye:

```bash
./start.sh
```

---

## 🛠️ Comandos Útiles

### Ver todos los puertos en uso

**Linux/Debian:**

```bash
sudo netstat -tuln
# O
sudo ss -tuln
```

**Windows:**

```powershell
netstat -ano
```

### Ver solo contenedores Docker

```bash
# Ver contenedores activos
docker ps

# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Ver qué puertos están mapeados
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

### Limpiar Todo Docker (⚠️ CUIDADO: Elimina TODO)

```bash
# Detener todos los contenedores
docker stop $(docker ps -aq)

# Eliminar todos los contenedores
docker rm $(docker ps -aq)

# Eliminar todas las imágenes no usadas
docker image prune -a

# Limpieza completa (⚠️ MUY PELIGROSO)
docker system prune -a --volumes
```

---

## 🔄 Prevención

El script `start.sh` ahora incluye limpieza automática de contenedores huérfanos antes de iniciar. Si aún tienes problemas:

1. **Ejecuta manualmente la limpieza:**

```bash
cd docker
docker compose down
docker ps -a | grep track_io | awk '{print $1}' | xargs docker rm -f
./start.sh
```

2. **Verifica que no tengas el backend corriendo localmente:**

```bash
# Si estás en desarrollo y tienes el backend corriendo con pnpm:
# Detén el proceso con Ctrl+C o:
pkill -f "nest start"
```

---

## 📝 Resumen Rápido

```bash
# 1. Ver qué está usando el puerto
sudo lsof -i :3000

# 2. Detener contenedores Docker
docker compose down
docker ps -a | grep track_io | awk '{print $1}' | xargs docker rm -f

# 3. Si es un proceso local, detenerlo
sudo kill -9 <PID>

# 4. Intentar de nuevo
./start.sh
```

---

## ❓ ¿Sigue sin funcionar?

1. Verifica que Docker esté corriendo: `docker ps`
2. Verifica permisos: `sudo docker ps` (si funciona sin sudo, hay un problema de permisos)
3. Reinicia Docker: `sudo systemctl restart docker` (Linux)
4. Revisa los logs: `docker compose logs`

