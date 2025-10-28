# Pasos de Debug - Virtual Device App

## 🔍 **Problema: Click no envía signals al backend**

### 📋 **Checklist de Debug (Seguir en orden)**

#### **1. Verificar Consola del Navegador**

- Abrir `F12` → pestaña `Console`
- Debe aparecer automáticamente:
  ```
  devices: [array de dispositivos]
  selectedDeviceId: null (inicialmente)
  selectedDevice: undefined (inicialmente)
  ```

#### **2. Verificar Dispositivos Virtuales**

- En la consola, buscar: `devices: [...]`
- **Si está vacío**: No hay dispositivos virtuales en el sistema
- **Si tiene datos**: Verificar que `isVirtualDevice: true`

#### **3. Seleccionar Dispositivo**

- Hacer click en el dropdown
- Seleccionar un dispositivo virtual
- En consola debe aparecer:
  ```
  selectedDeviceId: [número]
  selectedDevice: {id: X, name: "...", deviceSignals: [...]}
  ```

#### **4. Verificar DeviceSignals**

- En consola, buscar: `selectedDevice.deviceSignals`
- **Si está vacío**: El dispositivo no tiene departamentos configurados
- **Si tiene datos**: Debe mostrar array de departamentos

#### **5. Hacer Click en Carta de Departamento**

- Click en cualquier carta de departamento
- En consola debe aparecer:
  ```
  DepartmentCard clicked: {id: X, name: "...", ...}
  isSending: false
  error: undefined
  handleSendData called with: {id: X, name: "...", ...}
  selectedDeviceId: [número]
  Sending signal: {deviceId: X, deviceSignal: {...}}
  ```

#### **6. Verificar Request HTTP**

- En consola, buscar: `Signal sent successfully:`
- En pestaña `Network` del navegador:
  - Debe aparecer request a `POST /signals`
  - Status: `201 Created`
  - Response: `{"message":"Signal processed successfully",...}`

### 🚨 **Problemas Comunes y Soluciones**

#### **Problema 1: "devices: []" (Array vacío)**

```bash
# Solución: Crear dispositivos virtuales en dashboard-test
# 1. Ir a dashboard-test
# 2. Crear un dispositivo
# 3. Marcar "isVirtualDevice" como true
# 4. Configurar departamentos para el dispositivo
```

#### **Problema 2: "selectedDevice.deviceSignals: []" (Sin departamentos)**

```bash
# Solución: Configurar departamentos en el dispositivo
# 1. En dashboard-test, editar el dispositivo
# 2. Agregar deviceSignals/departamentos
# 3. Guardar cambios
```

#### **Problema 3: "DepartmentCard clicked:" no aparece**

```bash
# Solución: Problema de click event
# 1. Verificar que la carta sea clickeable
# 2. Revisar que no haya errores de JavaScript
# 3. Verificar que el Card component funcione
```

#### **Problema 4: "handleSendData called" no aparece**

```bash
# Solución: Problema de propagación de evento
# 1. Verificar que onSendData se pase correctamente
# 2. Revisar que DepartmentGrid pase la función
# 3. Verificar que VirtualDeviceApp tenga la función
```

#### **Problema 5: "Sending signal:" aparece pero no hay request HTTP**

```bash
# Solución: Problema en useSignalSender
# 1. Verificar que apiService.sendSignal funcione
# 2. Revisar que la URL del backend sea correcta
# 3. Verificar que no haya errores de CORS
```

### 🔧 **Comandos de Debug**

#### **Verificar Backend**

```bash
# En terminal, verificar que el backend esté ejecutándose
curl http://localhost:3000/signals -X POST -H "Content-Type: application/json" -d '{"id":"test","value":"123"}'
```

#### **Verificar Frontend**

```bash
# En terminal, verificar que el frontend esté ejecutándose
cd virtual-device
npm run dev
```

#### **Limpiar Caché**

```bash
# En el navegador
Ctrl+Shift+R (hard refresh)
```

### 📞 **Información para Reportar**

Si el problema persiste, proporcionar:

1. **Logs completos de la consola** (copiar y pegar todo)
2. **Screenshot de la pestaña Network** (mostrando requests)
3. **Datos del dispositivo seleccionado** (ID, nombre, deviceSignals)
4. **Status del backend** (ejecutándose o no)
5. **Errores de JavaScript** (si los hay)

### 🎯 **Resultado Esperado**

Al hacer click en una carta de departamento, debe aparecer en consola:

```
DepartmentCard clicked: {id: 1, name: "Temperatura", departmentId: 1, departmentName: "Producción", externalValueId: "TEMP-001"}
isSending: false
error: undefined
handleSendData called with: {id: 1, name: "Temperatura", ...}
selectedDeviceId: 1
Sending signal: {deviceId: 1, deviceSignal: {...}}
Signal sent successfully: {deviceId: 1, signalId: "TEMP-001", value: "25.5", response: {...}}
```

Y en la pestaña Network debe aparecer:

- `POST http://localhost:3000/signals`
- Status: `201 Created`
- Response: `{"message":"Signal processed successfully",...}`
