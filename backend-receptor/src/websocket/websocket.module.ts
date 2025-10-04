import { Module, Global } from '@nestjs/common';
import { WebSocketGateway } from './gateways/websocket.gateway';
import { WebSocketEmitterService } from './services/websocket-emitter.service';

@Global()
@Module({
  providers: [WebSocketGateway, WebSocketEmitterService],
  exports: [WebSocketEmitterService],
})
export class WebSocketModule {}
