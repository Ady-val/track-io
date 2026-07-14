# Track.IO - Docker Setup

Guía de instalación y uso del sistema Track.IO con Docker.

---

## 📋 Requisitos Previos

- **Docker Desktop** (Windows/Mac) o **Docker Engine + Docker Compose** (Linux)
- **Git** (para clonar el repositorio)
- **4GB RAM mínimo** (8GB recomendado)
- **10GB espacio en disco** libre

---

## 🪟 Instalación en Windows

### Paso 1: Instalar Docker Desktop

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
2. Ejecuta el instalador y sigue las instrucciones
3. Reinicia tu computadora cuando se solicite
4. Abre Docker Desktop y espera a que inicie completamente

### Paso 2: Verificar Instalación

Abre PowerShell o CMD y ejecuta:

```powershell
docker --version
docker compose version
```

Deberías ver las versiones instaladas.

### Paso 3: Clonar el Repositorio

```powershell
git clone <URL_DEL_REPOSITORIO>
cd track-io/docker
```

### Paso 4: Iniciar el Sistema

```powershell
start.bat
```

El script automáticamente:

- ✅ Detecta la IP de tu equipo
- ✅ Configura el sistema para acceso en red
- ✅ Construye e inicia todos los servicios
- ✅ Muestra las URLs de acceso

**⏱️ Tiempo estimado:** 5-10 minutos en la primera ejecución

---

## 🐧 Instalación en Linux (Debian/Ubuntu)

### Paso 1: Instalar Docker

```bash
# Actualizar el sistema
sudo apt update
sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Agregar clave GPG de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar sesión para aplicar cambios
```

### Paso 2: Verificar Instalación

```bash
docker --version
docker compose version
```

### Paso 3: Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd track-io/docker
```

### Paso 4: Iniciar el Sistema

```bash
chmod +x start.sh
./start.sh
```

El script automáticamente:

- ✅ Detecta la IP de tu equipo
- ✅ Configura el sistema para acceso en red
- ✅ Construye e inicia todos los servicios
- ✅ Muestra las URLs de acceso

**⏱️ Tiempo estimado:** 5-10 minutos en la primera ejecución

---

## 🍎 Instalación en macOS

### Paso 1: Instalar Docker Desktop

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
2. Abre el archivo `.dmg` descargado
3. Arrastra Docker a la carpeta Applications
4. Abre Docker Desktop desde Applications
5. Espera a que Docker inicie completamente

### Paso 2: Verificar Instalación

Abre Terminal y ejecuta:

```bash
docker --version
docker compose version
```

### Paso 3: Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd track-io/docker
```

### Paso 4: Iniciar el Sistema

```bash
chmod +x start.sh
./start.sh
```

---

## 🌐 Acceso al Sistema

Después de ejecutar `start.bat` o `start.sh`, verás las URLs de acceso:

### Acceso Local (misma computadora):

- **Dashboard**: http://localhost
- **Backend API**: http://localhost:3000

### Acceso en Red Local (otros dispositivos):

- **Dashboard**: http://[TU_IP]
- **Backend API**: http://[TU_IP]:3000

**Ejemplo:**

```
🌐 URLs de acceso:
   [Acceso en Red Local]
     Dashboard:       http://192.168.1.100
     Backend API:     http://192.168.1.100:3000
```

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo nginx
docker compose logs -f nginx

# Solo postgres
docker compose logs -f postgres
```

### Detener servicios

```bash
docker compose down
```

### Reiniciar servicios

```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

### Ver estado de los servicios

```bash
docker compose ps
```

### Acceder a la consola del backend

```bash
docker compose exec backend sh
```

### Ejecutar migraciones manualmente

```bash
docker compose exec backend npm run migration:run
```

---

## 🔄 Actualizar el Sistema

Cuando hay cambios en el código:

```bash
# 1. Actualizar código
git pull

# 2. Reiniciar servicios
# Windows:
start.bat

# Linux/Mac:
./start.sh

# 3. Si hay nuevas migraciones, ejecutarlas
docker compose exec backend npm run migration:run
```

**Nota:** El script detecta automáticamente si la IP cambió y solo reconstruye si es necesario.

---

## 🚨 Solución de Problemas

### Error: "port is already allocated"

El puerto 3000 o 80 está en uso. Solución:

```bash
# Detener todos los contenedores
docker compose down

# Ver qué está usando el puerto
# Windows:
netstat -ano | findstr :3000

# Linux/Mac:
sudo lsof -i :3000
sudo netstat -tuln | grep :3000

# Eliminar contenedores huérfanos
docker ps -a | grep track_io | awk '{print $1}' | xargs docker rm -f
```

### Error: "Cannot connect to Docker daemon"

Docker no está corriendo. Solución:

**Windows/Mac:** Abre Docker Desktop

**Linux:**

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Los servicios no inician

```bash
# Ver logs de errores
docker compose logs

# Verificar estado
docker compose ps

# Reiniciar desde cero
docker compose down -v
./start.sh  # o start.bat
```

### El frontend no carga

```bash
# Verificar que nginx esté corriendo
docker compose ps nginx

# Ver logs de nginx
docker compose logs nginx

# Verificar que el backend responda
curl http://localhost:3000
```

---

## 📁 Estructura de Archivos

```
docker/
├── docker-compose.yml    # Configuración principal de Docker
├── Dockerfile.backend    # Dockerfile del backend
├── Dockerfile.unified    # Dockerfile de Nginx + frontends
├── nginx.conf            # Configuración de Nginx
├── start.bat             # Script de inicio para Windows
├── start.sh              # Script de inicio para Linux/Mac
├── get-ip.ps1            # Script PowerShell para detectar IP (Windows)
└── README.md             # Este archivo
```

---

## ✨ Características

- **🚀 Un solo comando**: Solo ejecuta `start.bat` o `start.sh`
- **🌐 Configuración automática de red**: Detecta IP y configura todo automáticamente
- **⚡ Reconstrucción inteligente**: Solo reconstruye cuando la IP cambia
- **🔄 Reinicio automático**: Los contenedores se inician automáticamente al reiniciar el equipo
- **📡 Acceso en red**: Otros dispositivos pueden acceder inmediatamente
- **💾 Persistencia de datos**: Los datos sobreviven a reinicios de contenedores
- **🔒 Sin problemas de CORS**: Proxy reverso elimina problemas de CORS

---

## ⚙️ Variables de Entorno

Puedes configurar el sistema mediante variables de entorno. Crea un archivo `.env` en la carpeta `docker/` o exporta las variables antes de ejecutar `start.bat` o `start.sh`:

### Variables de Módulos del Sistema

Controla qué módulos están habilitados en el sistema:

```bash
# Habilitar/deshabilitar módulo de Mediciones (default: true)
MODULE_MEASUREMENTS_ENABLED=true

# Habilitar/deshabilitar módulo de Señales (default: true)
MODULE_SIGNALS_ENABLED=true
```

**Ejemplo de uso:**

```bash
# Deshabilitar solo el módulo de señales
export MODULE_SIGNALS_ENABLED=false
./start.sh

# O crear un archivo .env en docker/
echo "MODULE_SIGNALS_ENABLED=false" > docker/.env
./start.sh
```

**Nota:** Estas variables controlan:
- **Backend**: Qué endpoints están disponibles y protegidos por el `SystemModuleGuard`
- **Frontend**: Qué módulos se muestran en el sidebar y qué catálogos están disponibles

### Otras Variables Disponibles

```bash
# Base de datos
POSTGRES_DB=track_io
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Backend
NODE_ENV=production

# NODE_RED_EVENTS_URL: destino de los POST salientes (torretas / mensajes de alerta)
# Por defecto usa host.docker.internal. Solo cambiar si Node-RED vive en otra dirección.
NODE_RED_EVENTS_URL=http://host.docker.internal:1880/events

# VITE_API_URL (OPCIONAL): por defecto VACÍA. Los frontends usan rutas relativas
# al mismo origen (nginx proxea /api y /socket.io al backend), así que el mismo
# build funciona en cualquier IP/dominio SIN reconstruir. Definir solo si el
# backend vive en un host distinto al que sirve el frontend.
# VITE_API_URL=http://mi-backend-externo:3000
```

---

## 📝 Notas Importantes

- **Primera ejecución**: Puede tardar 5-10 minutos mientras descarga imágenes y compila
- **Reinicio del equipo**: Los contenedores se iniciarán automáticamente gracias a `restart: always`
- **Cambio de red / IP**: ya **no** requiere reconstruir. El frontend detecta el origen
  desde el navegador y nginx enruta al backend; el mismo build sirve para cualquier IP o
  dominio. Basta con acceder por la nueva IP (`http://<nueva-ip>`).
- **Migraciones**: Se ejecutan automáticamente al iniciar, no necesitas ejecutarlas manualmente
- **Módulos del sistema**: Puedes habilitar/deshabilitar módulos mediante variables de entorno sin modificar código

---

## 🆘 ¿Necesitas Ayuda?

1. Verifica que Docker esté corriendo: `docker ps`
2. Revisa los logs: `docker compose logs -f`
3. Verifica el estado: `docker compose ps`
4. Reinicia desde cero: `docker compose down -v && ./start.sh`
