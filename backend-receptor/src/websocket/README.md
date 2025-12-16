# WebSocket Module

Este módulo proporciona funcionalidad de WebSocket para el backend-receptor, permitiendo la comunicación en tiempo real con clientes conectados.

## Características

- **Gateway de WebSocket**: Maneja las conexiones de clientes y eventos de conexión/desconexión
- **Servicio de Emisión**: Permite emitir mensajes desde cualquier servicio del backend
- **Integración Global**: Disponible en toda la aplicación mediante el decorador `@Global()`

## Estructura

```
src/websocket/
├── constants/
│   └── websocket-events.constant.ts  # Constantes de eventos WebSocket
├── gateways/
│   └── websocket.gateway.ts    # Gateway principal de WebSocket
├── services/
│   └── websocket-emitter.service.ts  # Servicio para emitir mensajes
├── websocket.module.ts         # Módulo de WebSocket
├── index.ts                    # Punto de entrada principal (barrel export)
└── README.md                   # Esta documentación
```

## Uso

### 1. Inyección del Servicio

Para usar el servicio de emisión de mensajes en cualquier servicio:

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketEmitterService, WEBSOCKET_EVENTS } from '../websocket';

@Injectable()
export class MiServicio {
  constructor(
    private readonly webSocketEmitterService: WebSocketEmitterService
  ) {}

  async miMetodo() {
    // Emitir mensaje a todos los clientes
    this.webSocketEmitterService.emitToAll(WEBSOCKET_EVENTS.SYSTEM_MESSAGE, {
      data: 'valor',
    });

    // Emitir mensaje a un cliente específico
    this.webSocketEmitterService.emitToClient(
      'client_id',
      WEBSOCKET_EVENTS.USER_JOINED,
      {
        data: 'valor',
      }
    );

    // Emitir mensaje a una sala específica
    this.webSocketEmitterService.emitToRoom(
      'mi_sala',
      WEBSOCKET_EVENTS.SYSTEM_MESSAGE,
      {
        data: 'valor',
      }
    );
  }
}
```

### 2. Constantes de Eventos

El módulo utiliza constantes centralizadas para evitar errores de tipeo y facilitar el mantenimiento:

```typescript
import { WEBSOCKET_EVENTS } from '../websocket';

// Eventos disponibles:
WEBSOCKET_EVENTS.NEW_RAW_SIGNAL; // 'new_raw_signal'
WEBSOCKET_EVENTS.CONNECTION; // 'connection'
WEBSOCKET_EVENTS.DISCONNECT; // 'disconnect'
WEBSOCKET_EVENTS.USER_JOINED; // 'user_joined'
WEBSOCKET_EVENTS.USER_LEFT; // 'user_left'
WEBSOCKET_EVENTS.SYSTEM_MESSAGE; // 'system_message'
```

**Ventajas de usar constantes:**

- ✅ Autocompletado en el IDE
- ✅ Verificación de tipos en tiempo de compilación
- ✅ Refactoring seguro
- ✅ Prevención de errores de tipeo
- ✅ Centralización de nombres de eventos

**Ventajas del archivo de índice (`index.ts`):**

- ✅ Importaciones más limpias y concisas
- ✅ Facilita el refactoring interno del módulo
- ✅ Encapsula la estructura interna del módulo
- ✅ Proporciona una API pública clara

### 3. Eventos Disponibles

#### `NEW_RAW_SIGNAL`

Se emite automáticamente cuando se crea un nuevo signal en la base de datos.

```typescript
// Este evento se emite automáticamente desde SignalService.processSignal()
this.webSocketEmitterService.emitNewRawSignal({
  id: 123,
  externalId: 'signal_001',
  value: 'valor_del_signal',
  createdAt: new Date(),
});

// También se puede usar la constante directamente
import { WEBSOCKET_EVENTS } from '../websocket';
this.webSocketEmitterService.emitToAll(
  WEBSOCKET_EVENTS.NEW_RAW_SIGNAL,
  signalData
);
```

### 4. Formato de Mensajes

Todos los mensajes emitidos siguen el formato:

```typescript
interface WebSocketMessage {
  event: string; // Nombre del evento
  data: unknown; // Datos del mensaje
  timestamp: Date; // Timestamp de emisión
}
```

## Configuración

El WebSocket está configurado con CORS habilitado para todos los orígenes (`origin: '*'`). En producción, se recomienda especificar los dominios permitidos.

## Cliente WebSocket

Para conectarse desde un cliente, use Socket.IO:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Escuchar el evento de nuevo signal
socket.on('new_raw_signal', message => {
  // message.data contiene los datos del signal
});

// También se puede usar constantes en el cliente (si se comparten)
// import { WEBSOCKET_EVENTS } from './websocket';
// socket.on(WEBSOCKET_EVENTS.NEW_RAW_SIGNAL, message => { ... });

// Escuchar eventos personalizados
socket.on('system_message', message => {});
```

## Logs

El módulo genera logs para:

- Inicialización del gateway
- Conexiones y desconexiones de clientes
- Emisión de mensajes (con errores si ocurren)

## Manejo de Errores

- Los errores en la emisión de mensajes se logean pero no interrumpen el flujo principal
- Si hay un error al emitir un mensaje WebSocket, el proceso continúa normalmente
