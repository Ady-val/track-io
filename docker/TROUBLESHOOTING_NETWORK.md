# 🔧 Solución de Problemas de Red - Timeout en Login

## Problema

El frontend apunta a `http://192.168.68.105:3000/` pero obtiene error de timeout al intentar iniciar sesión.

## Diagnóstico

### 1. Verificar que el Backend está Corriendo

```bash
cd docker
docker-compose ps
```

Deberías ver `track_io_backend` con estado `Up`.

### 2. Verificar que el Puerto está Escuchando

**En Windows (PowerShell):**
```powershell
netstat -an | Select-String -Pattern "3000"
```

Deberías ver:
```
TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
TCP    [::]:3000              [::]:0                 LISTENING
```

### 3. Probar Conectividad desde el Host

**Desde el mismo equipo donde corre Docker:**
```powershell
Test-NetConnection -ComputerName localhost -Port 3000
```

**Desde otro equipo en la red:**
```powershell
Test-NetConnection -ComputerName 192.168.68.105 -Port 3000
```

Si el segundo comando falla, el problema es de red/firewall.

### 4. Verificar Firewall de Windows

El firewall de Windows puede estar bloqueando el puerto 3000. Para permitirlo:

**Opción A: Usar PowerShell (como Administrador)**
```powershell
New-NetFirewallRule -DisplayName "Track.IO Backend Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Opción B: Usar Interfaz Gráfica**
1. Abre "Firewall de Windows Defender con seguridad avanzada"
2. Click en "Reglas de entrada" → "Nueva regla"
3. Selecciona "Puerto" → Siguiente
4. Selecciona "TCP" y escribe `3000` → Siguiente
5. Selecciona "Permitir la conexión" → Siguiente
6. Marca todos los perfiles → Siguiente
7. Nombre: "Track.IO Backend Port 3000" → Finalizar

### 5. Verificar Logs del Backend

```bash
cd docker
docker-compose logs backend --tail 50
```

Busca errores relacionados con:
- Conexión a la base de datos
- Errores de autenticación
- Timeouts

### 6. Probar el Endpoint de Login Directamente

**Desde el mismo equipo:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"test","password":"test"}' -TimeoutSec 10
```

**Desde otro equipo en la red:**
```powershell
Invoke-WebRequest -Uri "http://192.168.68.105:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"test","password":"test"}' -TimeoutSec 10
```

### 7. Verificar Configuración de Docker

Asegúrate de que en `docker-compose.yml` el puerto esté mapeado correctamente:

```yaml
backend:
  ports:
    - "0.0.0.0:3000:3000"  # ✅ Correcto - expone en todas las interfaces
    # NO usar: "127.0.0.1:3000:3000" ❌ - solo localhost
```

### 8. Verificar que el Backend Escucha en Todas las Interfaces

El backend debe escuchar en `0.0.0.0`, no solo en `localhost`. En `backend-receptor/src/main.ts`:

```typescript
await app.listen(process.env['PORT'] ?? 3000);
```

Esto escucha en `0.0.0.0` por defecto, que es correcto.

## Soluciones Comunes

### Solución 1: Permitir Puerto en Firewall (MÁS COMÚN)

```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "Track.IO Backend Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Solución 2: Verificar IP del Host

Asegúrate de que `192.168.68.105` es realmente la IP de tu máquina:

```powershell
ipconfig
```

Busca la IP en la sección de tu adaptador de red (Wi-Fi o Ethernet).

### Solución 3: Reiniciar Contenedores

```bash
cd docker
docker-compose restart backend
```

### Solución 4: Verificar que no hay Otro Servicio Usando el Puerto

```powershell
netstat -ano | Select-String -Pattern ":3000"
```

Si hay otro proceso usando el puerto, detén ese proceso o cambia el puerto del backend.

### Solución 5: Usar Nginx como Proxy (RECOMENDADO)

En lugar de acceder directamente al backend, usa Nginx que ya está configurado:

- **Backend API:** `http://192.168.68.105/api` (proxied por Nginx)
- **Dashboard:** `http://192.168.68.105`
- **Virtual Device:** `http://192.168.68.105/virtual-device`

Nginx ya está configurado para hacer proxy del backend en el puerto 80, que normalmente no está bloqueado por el firewall.

## Verificación Final

Después de aplicar las soluciones:

1. **Verificar conectividad:**
   ```powershell
   Test-NetConnection -ComputerName 192.168.68.105 -Port 3000
   ```
   Debería mostrar `TcpTestSucceeded : True`

2. **Probar login:**
   ```powershell
   Invoke-WebRequest -Uri "http://192.168.68.105:3000/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"tu_password"}' -TimeoutSec 10
   ```

3. **Verificar en el frontend:**
   - Abre el frontend
   - Intenta iniciar sesión
   - Debería funcionar sin timeout

## Notas Importantes

- El puerto 3000 debe estar abierto en el firewall de Windows
- Docker mapea el puerto correctamente (`0.0.0.0:3000:3000`)
- El backend escucha en todas las interfaces por defecto
- Si el problema persiste, considera usar Nginx como proxy (puerto 80) en lugar de acceder directamente al backend


