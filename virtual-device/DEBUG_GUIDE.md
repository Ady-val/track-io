# Guía de Debug - Virtual Device App

## 🔍 **Problema Identificado: Click no envía signals**

### ✅ **Backend Verificado**

- ✅ **Endpoint `/signals`**: Funcionando correctamente
- ✅ **Status 201**: Signal creado exitosamente
- ✅ **CORS**: Configurado para puerto 5174
- ✅ **Backend**: Ejecutándose en puerto 3000

### 🐛 **Posibles Causas del Problema**

#### **1. Dispositivo No Seleccionado**

```javascript
// Verificar en la consola del navegador:
console.log("Selected device ID:", selectedDeviceId);
```

#### **2. DeviceSignal Vacío**

```javascript
// Verificar que deviceSignal tenga datos:
console.log("DeviceSignal:", deviceSignal);
// Debe tener: id, name, departmentId, departmentName, externalValueId
```

#### **3. Problema de Click Event**

```javascript
// Verificar que el click se registre:
// Debe aparecer en consola: "DepartmentCard clicked:"
```

### 🔧 **Pasos para Debuggear**

#### **1. Abrir Consola del Navegador**

- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña `Console`

#### **2. Seleccionar un Dispositivo Virtual**

- Asegúrate de que hay dispositivos virtuales disponibles
- Selecciona uno del dropdown

#### **3. Hacer Click en una Carta de Departamento**

- Debe aparecer en consola: `"DepartmentCard clicked:"`
- Debe aparecer: `"Sending signal:"`
- Debe aparecer: `"Signal sent successfully:"`

#### **4. Verificar Errores**

- Si hay errores, aparecerán en rojo en la consola
- Revisar la pestaña `Network` para ver requests HTTP

### 🚨 **Errores Comunes**

#### **Error 1: "No device selected"**

```javascript
// Solución: Seleccionar un dispositivo virtual primero
```

#### **Error 2: "DeviceSignal is undefined"**

```javascript
// Solución: Verificar que el dispositivo tenga deviceSignals
```

#### **Error 3: "CORS error"**

```javascript
// Solución: Verificar que el backend esté ejecutándose
// y que CORS esté configurado para puerto 5174
```

#### **Error 4: "Network error"**

```javascript
// Solución: Verificar que el backend esté en puerto 3000
```

### 📋 **Checklist de Debug**

- [ ] **Backend ejecutándose** en puerto 3000
- [ ] **Dispositivo virtual seleccionado** en el dropdown
- [ ] **Departamentos disponibles** en las cartas
- [ ] **Click registrado** en consola
- [ ] **Signal enviado** sin errores
- [ ] **Response recibido** del backend

### 🔍 **Logs Esperados**

```javascript
// 1. Al hacer click en la carta:
"DepartmentCard clicked: {id: 1, name: 'Temperatura', ...}";

// 2. Al enviar signal:
"Sending signal: {deviceId: 1, deviceSignal: {...}}";

// 3. Al recibir respuesta:
"Signal sent successfully: {deviceId: 1, signalId: 'TEMP-001', value: '25.5', response: {...}}";
```

### 🚀 **Solución Rápida**

Si el problema persiste:

1. **Reiniciar el backend**:

   ```bash
   cd backend-receptor
   npm run start:dev
   ```

2. **Reiniciar el frontend**:

   ```bash
   cd virtual-device
   npm run dev
   ```

3. **Limpiar caché del navegador**: `Ctrl+Shift+R`

### 📞 **Información para Reportar**

Si el problema persiste, proporcionar:

1. **Logs de la consola** (copiar y pegar)
2. **Errores de red** (pestaña Network)
3. **Dispositivo seleccionado** (ID y nombre)
4. **DeviceSignal** (datos completos)
5. **Status del backend** (ejecutándose o no)
