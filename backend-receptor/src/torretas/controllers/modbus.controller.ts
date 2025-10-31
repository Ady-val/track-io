import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ModbusService } from '../application/services/modbus.service';

type Payload = { capcode?: string; message?: string; register?: string | number; value?: string | number };

@Controller('modbus')
export class ModbusController {
  private readonly logger = new Logger(ModbusController.name);

  constructor(private readonly modbusService: ModbusService) {}

  @Post('events')
  @HttpCode(HttpStatus.OK)
  async handleEvent(@Body() body: Payload) {
    try {
      this.logger.log(`Incoming /modbus/events body: ${JSON.stringify(body)}`);
      // Nuevo formato: { "register": "1", "value": "1" }
      if (body.register !== undefined && body.value !== undefined) {
        const regNum = Number(body.register);
        const valNum = Number(body.value);
        if (!Number.isFinite(regNum) || !Number.isFinite(valNum)) {
          return { ok: false, error: 'Invalid register/value. Must be numbers.' };
        }
        this.logger.log(`Using direct register/value path: register=${regNum}, value=${valNum}`);
        await this.modbusService.writeSingleRegister(regNum, valNum);
        return { ok: true };
      }

      // Compatibilidad anterior: { capcode, message }
      if (body.capcode && body.message) {
        this.logger.log(`Using capcode/message path: capcode=${body.capcode}, message=${body.message}`);
        await this.modbusService.processCapcodeMessage(body.capcode, body.message);
        return { ok: true };
      }

      return { ok: false, error: 'Invalid payload. Use {register,value} or {capcode,message}.' };
    } catch (error) {
      return {
        ok: false,
        error: (error as Error).message,
      };
    }
  }
}


