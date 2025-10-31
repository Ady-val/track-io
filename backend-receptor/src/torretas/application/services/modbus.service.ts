import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ModbusRTU = require('modbus-serial');

@Injectable()
export class ModbusService {
  private readonly logger = new Logger(ModbusService.name);
  private client: any;
  private host: string;
  private port: number;
  private unitId: number;
  private connectTimeoutMs: number;
  private requestTimeoutMs: number;
  private verifyWrite: boolean;
  private zeroBased: boolean;
  // Simple de-duplication caches to avoid repeated identical writes
  private lastSingleByAddress = new Map<number, number>();
  private lastMultiByStart = new Map<number, string>();

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('MODBUS_HOST') ?? 'host.docker.internal';
    this.port = Number(this.configService.get<string>('MODBUS_PORT') ?? 502);
    this.unitId = Number(this.configService.get<string>('MODBUS_UNIT_ID') ?? 1);
    this.connectTimeoutMs = Number(
      this.configService.get<string>('MODBUS_CONNECT_TIMEOUT_MS') ?? 2000
    );
    this.requestTimeoutMs = Number(
      this.configService.get<string>('MODBUS_REQUEST_TIMEOUT_MS') ?? 1500
    );

    this.client = new ModbusRTU();
    this.client.setID(this.unitId);
    this.client.setTimeout(this.requestTimeoutMs);

    this.verifyWrite = (this.configService.get<string>('MODBUS_VERIFY_WRITE') ?? 'false') === 'true';
    this.zeroBased = (this.configService.get<string>('MODBUS_ZERO_BASED_REGISTERS') ?? 'false') === 'true';
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) return;
    await new Promise<void>((resolve, reject) => {
      // modbus-serial connectTCP(host, { port })
      const timer = setTimeout(() => {
        reject(new Error('Modbus connect timeout'));
      }, this.connectTimeoutMs);

      this.client.connectTCP(this.host, { port: this.port }, (err: Error | null) => {
        clearTimeout(timer);
        if (err) return reject(err);
        this.logger.log(`Connected to Modbus TCP ${this.host}:${this.port} (unit ${this.unitId})`);
        resolve();
      });
    });
  }

  async writeSingleRegister(registerAddress: number, value: number): Promise<void> {
    // Skip identical write to same address
    const last = this.lastSingleByAddress.get(registerAddress);
    if (last === value) {
      this.logger.debug?.(`Skip FC6 (unchanged) register ${registerAddress} = ${value}`);
      return;
    }
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      attempt += 1;
      try {
        await this.ensureConnected();
        const targetRegister = this.zeroBased ? Math.max(0, registerAddress - 1) : registerAddress;
        this.logger.log(
          `Writing (FC6) register ${targetRegister} = ${value} (input=${registerAddress}, zeroBased=${this.zeroBased})`
        );
        await this.client.writeRegister(targetRegister, value);

        if (this.verifyWrite) {
          try {
            const read = await this.client.readHoldingRegisters(targetRegister, 1);
            this.logger.log(
              `Read-back register ${targetRegister} -> ${read?.data?.[0]} (expected ${value})`
            );
          } catch (readErr) {
            this.logger.warn(`Read-back failed: ${(readErr as Error).message}`);
          }
        }
        this.lastSingleByAddress.set(registerAddress, value);
        return;
      } catch (error) {
        this.logger.error(
          `Modbus write attempt ${attempt} failed: ${(error as Error).message}`
        );
        // Recreate client on failure
        try {
          this.client.close?.();
        } catch {}
        this.client = new ModbusRTU();
        this.client.setID(this.unitId);
        this.client.setTimeout(this.requestTimeoutMs);
        if (attempt >= maxRetries) throw error;
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  async writeMultipleRegisters(startAddress: number, values: number[]): Promise<void> {
    // Skip identical write for same starting address and values
    const keyValues = values.join(',');
    const lastValues = this.lastMultiByStart.get(startAddress);
    if (lastValues === keyValues) {
      this.logger.debug?.(
        `Skip FC16 (unchanged) from ${startAddress} values=[${keyValues}]`
      );
      return;
    }
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      attempt += 1;
      try {
        await this.ensureConnected();
        const targetStart = this.zeroBased ? Math.max(0, startAddress - 1) : startAddress;
        this.logger.log(
          `Writing (FC16) from ${targetStart} values=[${values.join(',')}] (inputStart=${startAddress}, zeroBased=${this.zeroBased})`
        );
        await this.client.writeRegisters(targetStart, values);
        this.lastMultiByStart.set(startAddress, keyValues);
        return;
      } catch (error) {
        this.logger.error(
          `Modbus multi-write attempt ${attempt} failed: ${(error as Error).message}`
        );
        try {
          this.client.close?.();
        } catch {}
        this.client = new ModbusRTU();
        this.client.setID(this.unitId);
        this.client.setTimeout(this.requestTimeoutMs);
        if (attempt >= maxRetries) throw error;
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  // Helper to process payload like Node-RED: { capcode: 'TL701', message: '11111' }
  async processCapcodeMessage(capcode: string, message: string): Promise<void> {
    // Aceptar cualquier capcode (algunos flujos usan TL70/TL701/etc.)
    if (typeof message !== 'string') return;
    this.logger.log(`Parsing capcode message: capcode=${capcode}, message=${message}`);

    const MAP: Record<string, number> = { '1111': 1, '2222': 2, '3333': 3 };
    const s = message.trim();
    const writes: Array<{ address: number; value: number }> = [];

    for (const prefix of Object.keys(MAP)) {
      if (s.startsWith(prefix)) {
        const logical = MAP[prefix as keyof typeof MAP]!;
        const addr0 = logical; // we use 1-based here; zeroBased setting adjusts on write
        const value = s.endsWith('1') ? 1 : 0;
        this.logger.log(`Matched prefix ${prefix} -> logical=${logical}, value=${value}`);
        writes.push({ address: addr0, value });
      }
    }

    if (writes.length === 0) return;

    writes.sort((a, b) => a.address - b.address);
    let consecutivos = true;
    for (let i = 1; i < writes.length; i++) {
      const curr = writes[i]!;
      const prev = writes[i - 1]!;
      if (curr.address !== prev.address + 1) {
        consecutivos = false;
        break;
      }
    }

    if (writes.length === 1) {
      const first = writes[0]!;
      await this.writeSingleRegister(first.address, first.value);
      return;
    }

    if (consecutivos) {
      const start = writes[0]!.address;
      const values = writes.map(w => w.value);
      await this.writeMultipleRegisters(start, values);
      return;
    }

    for (const w of writes) {
      await this.writeSingleRegister(w.address, w.value);
    }
  }
}


