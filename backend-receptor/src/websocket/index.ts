/**
 * Módulo de WebSocket - Punto de entrada principal
 *
 * Este archivo exporta todas las funcionalidades del módulo de WebSocket
 * para facilitar las importaciones desde otros módulos.
 */

// Constantes
export {
  WEBSOCKET_EVENTS,
  type WebSocketEvent,
} from './constants/websocket-events.constant';

// Servicios
export {
  WebSocketEmitterService,
  type WebSocketMessage,
} from './services/websocket-emitter.service';

// Gateway
export { WebSocketGateway } from './gateways/websocket.gateway';

// Módulo
export { WebSocketModule } from './websocket.module';
