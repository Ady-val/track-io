# Configuración del Entorno Virtual Device

## 🚀 Pasos para Configurar el Entorno

### 1. Backend (Track.IO)

Asegúrate de que el backend esté ejecutándose en el puerto 3000:

```bash
cd backend-receptor
npm run start:dev
# o
pnpm start:dev
```

### 2. Configuración de CORS

El backend ya está configurado para permitir ambos puertos:

- `http://localhost:5173` (Dashboard Test)
- `http://localhost:5174` (Virtual Device)

### 3. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto virtual-device:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Virtual Device Simulator
VITE_APP_VERSION=1.0.0
```

### 4. Ejecutar la Aplicación

```bash
cd virtual-device
npm run dev
# o
pnpm dev
```

La aplicación se ejecutará en `http://localhost:5174`

## 🔧 Solución de Problemas

### Error de CORS

Si sigues teniendo problemas de CORS:

1. **Reinicia el backend** después de los cambios de CORS
2. **Verifica que el backend esté en el puerto 3000**
3. **Limpia la caché del navegador**

### Verificar Configuración

Puedes verificar que la configuración esté correcta:

```bash
# En el backend, verifica que esté ejecutándose
curl http://localhost:3000/devices

# En el frontend, verifica la URL de la API
console.log(import.meta.env.VITE_API_URL)
```

## 📋 Checklist

- [ ] Backend ejecutándose en puerto 3000
- [ ] CORS configurado para puerto 5174
- [ ] Variables de entorno configuradas
- [ ] Aplicación virtual-device ejecutándose en puerto 5174
- [ ] Sin errores de CORS en la consola del navegador

## 🎯 Próximos Pasos

1. **Crear dispositivos virtuales** desde el dashboard principal
2. **Configurar departamentos** para cada dispositivo
3. **Probar el envío de datos** desde la aplicación virtual-device
