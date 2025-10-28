# Corrección de Envío de Signals - Virtual Device App

## 🔧 **Problema Identificado y Solucionado**

### ❌ **Problema Anterior:**

```json
// Lo que se enviaba al backend (INCORRECTO):
{
  "externalId": "432", // ❌ externalId del device
  "value": "62.58" // ❌ valor aleatorio
}
```

### ✅ **Solución Implementada:**

```json
// Lo que se envía ahora al backend (CORRECTO):
{
  "id": "DEV-001", // ✅ externalId del device
  "value": "TEMP-001" // ✅ externalValueId del signalDevice
}
```

## 🔄 **Cambios Realizados**

### **1. API Service (`api.ts`)**

```typescript
// ANTES (INCORRECTO):
async sendSignal(deviceId: number, signalId: string, value: string) {
  const signalData = {
    id: signalId,           // ❌ externalValueId del signal
    value: value            // ❌ valor aleatorio
  };
}

// DESPUÉS (CORRECTO):
async sendSignal(_deviceId: number, device: Device, deviceSignal: DeviceSignal) {
  const signalData = {
    id: device.externalId,                    // ✅ externalId del device
    value: deviceSignal.externalValueId      // ✅ externalValueId del signalDevice
  };
}
```

### **2. Hook useSignalSender (`useSignalSender.ts`)**

```typescript
// ANTES (INCORRECTO):
const sendSignal = async (deviceId: number, deviceSignal: DeviceSignal) => {
  const randomValue = (Math.random() * 100).toFixed(2);
  await apiService.sendSignal(
    deviceId,
    deviceSignal.externalValueId,
    randomValue
  );
};

// DESPUÉS (CORRECTO):
const sendSignal = async (
  deviceId: number,
  device: Device,
  deviceSignal: DeviceSignal
) => {
  await apiService.sendSignal(deviceId, device, deviceSignal);
};
```

### **3. VirtualDeviceApp (`VirtualDeviceApp.tsx`)**

```typescript
// ANTES (INCORRECTO):
const result = await sendSignal(selectedDeviceId, deviceSignal);

// DESPUÉS (CORRECTO):
const result = await sendSignal(selectedDeviceId, selectedDevice, deviceSignal);
```

## 🎯 **Datos Correctos Enviados**

### **Estructura del Request:**

```json
{
  "id": "DEV-001", // externalId del dispositivo virtual
  "value": "TEMP-001" // externalValueId del signalDevice
}
```

### **Ejemplo Real:**

```json
// Para dispositivo "Test 1" con signalDevice "Calidad":
{
  "id": "TEST-001", // externalId del dispositivo "Test 1"
  "value": "QUALITY-001" // externalValueId del signalDevice "Calidad"
}
```

## ✅ **Verificación**

### **Logs Esperados en Consola:**

```javascript
// Al hacer click en una carta:
"Sending signal: {
  deviceId: 1,
  deviceExternalId: 'TEST-001',
  signalExternalValueId: 'QUALITY-001'
}"

// Al recibir respuesta:
"Signal sent successfully: {
  deviceId: 1,
  deviceExternalId: 'TEST-001',
  signalExternalValueId: 'QUALITY-001',
  response: {...}
}"
```

### **Request HTTP Esperado:**

```http
POST /signals
Content-Type: application/json

{
  "id": "TEST-001",
  "value": "QUALITY-001"
}
```

### **Response Esperado:**

```json
{
  "message": "Signal processed successfully",
  "data": {
    "id": 123,
    "externalId": "TEST-001",
    "value": "QUALITY-001",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🚀 **Resultado Final**

- ✅ **externalId del device** se envía como `id`
- ✅ **externalValueId del signalDevice** se envía como `value`
- ✅ **No más valores aleatorios** generados
- ✅ **Datos correctos** enviados al backend
- ✅ **Build exitoso** sin errores

La aplicación ahora envía los datos correctos al backend, usando el `externalId` del dispositivo virtual y el `externalValueId` del signalDevice correspondiente.
