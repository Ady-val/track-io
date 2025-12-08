# 🐧 Preparación de Debian para Track.IO

Guía básica para preparar tu equipo Debian y levantar el ambiente Docker en producción.

## 📋 Requisitos Previos

- Debian 10 (Buster) o superior
- Acceso de administrador (sudo)
- Conexión a Internet

---

## 🔧 Paso 1: Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

---

## 🐳 Paso 2: Instalar Docker

### 2.1. Instalar dependencias necesarias

```bash
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
```

### 2.2. Agregar la clave GPG oficial de Docker

```bash
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### 2.3. Agregar el repositorio de Docker

```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 2.4. Instalar Docker Engine

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### 2.5. Verificar que Docker está instalado

```bash
docker --version
```

Deberías ver algo como: `Docker version 24.x.x`

---

## 👤 Paso 3: Configurar Usuario para Docker (Opcional pero Recomendado)

Para no tener que usar `sudo` cada vez:

```bash
sudo usermod -aG docker $USER
```

**⚠️ IMPORTANTE:** Cierra sesión y vuelve a iniciar sesión para que los cambios surtan efecto.

---

## 📦 Paso 4: Instalar Docker Compose (si no está incluido)

Docker Compose V2 ya viene incluido con Docker, pero si necesitas la versión standalone:

```bash
sudo apt install -y docker-compose
```

Verificar:

```bash
docker compose version
```

---

## 📥 Paso 5: Obtener el Proyecto

### Opción A: Clonar desde Git

```bash
git clone <URL_DEL_REPOSITORIO>
cd track-io/docker
```

### Opción B: Copiar archivos manualmente

Si tienes los archivos en otro lugar, cópialos a tu servidor Debian.

---

## ⚙️ Paso 6: Configurar Variables de Entorno (Opcional)

Si necesitas cambiar configuraciones por defecto:

```bash
cp env.example .env
nano .env
```

**Nota:** Si no creas el archivo `.env`, el sistema usará los valores por defecto.

---

## 🚀 Paso 7: Dar Permisos de Ejecución al Script

```bash
chmod +x start.sh
```

---

## ✅ Paso 8: Iniciar el Sistema

```bash
./start.sh
```

El script automáticamente:
- ✅ Detecta la IP de tu equipo
- ✅ Configura el sistema para acceso en red
- ✅ Construye e inicia todos los servicios
- ✅ Muestra las URLs de acceso

**⏱️ Tiempo estimado:** 5-10 minutos en la primera ejecución (descarga imágenes y compila)

---

## 🌐 Paso 9: Verificar que Todo Funciona

Después de ejecutar `./start.sh`, verás algo como:

```
✅ Servicios iniciados correctamente!

🌐 URLs de acceso:
   [Acceso Local]
     Dashboard:       http://localhost
     Virtual Device:  http://localhost/virtual-device
     Backend API:     http://localhost:3000

   [Acceso en Red Local]
     Dashboard:       http://192.168.x.x
     Virtual Device:  http://192.168.x.x/virtual-device
     Backend API:     http://192.168.x.x:3000
```

Abre `http://localhost` en tu navegador para verificar.

---

## 🔍 Comandos Útiles

### Ver el estado de los servicios

```bash
docker compose ps
```

### Ver los logs

```bash
docker compose logs -f
```

### Detener los servicios

```bash
docker compose down
```

### Reiniciar los servicios

```bash
./start.sh
```

---

## ❗ Solución de Problemas

### Error: "Permission denied" al ejecutar Docker

```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar sesión
```

### Error: "Cannot connect to Docker daemon"

```bash
# Iniciar el servicio Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### Error: Puerto 80 o 3000 ya en uso

```bash
# Ver qué está usando el puerto
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000

# Detener el servicio que está usando el puerto o cambiar los puertos en docker-compose.yml
```

---

## 📝 Resumen Rápido

```bash
# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 3. Agregar usuario a grupo docker
sudo usermod -aG docker $USER

# 4. Cerrar sesión y volver a iniciar sesión

# 5. Ir a la carpeta docker
cd track-io/docker

# 6. Dar permisos y ejecutar
chmod +x start.sh
./start.sh
```

---

## ✅ ¡Listo!

Tu equipo Debian está preparado y el sistema Track.IO está corriendo en producción.

Para más información, consulta `README.md` en la carpeta `docker/`.

