import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TestSeedService implements OnModuleInit {
  private readonly logger = new Logger(TestSeedService.name);
  private readonly ADMIN_USERNAME = 'ADMIN';
  private readonly ADMIN_PASSWORD = 'Admin123!';
  private readonly ADMIN_NAME = 'Administrador';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    // Solo ejecutar seed en modo test
    if (this.configService.get('NODE_ENV') !== 'test') {
      return;
    }

    // Esperar un poco para que TypeORM sincronice el schema
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await this.seedAdminUser();
    } catch (error) {
      this.logger.error(`Error seeding test data: ${(error as Error).message}`);
    }
  }

  private async seedAdminUser(): Promise<void> {
    // Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findOne({
      where: { username: this.ADMIN_USERNAME },
      withDeleted: false,
    });

    if (existingUser) {
      this.logger.log(
        `Usuario ${this.ADMIN_USERNAME} ya existe, saltando creación`
      );
      return;
    }

    // Crear usuario ADMIN
    const hashedPassword = await bcrypt.hash(this.ADMIN_PASSWORD, 10);
    const adminUser = this.userRepository.create({
      name: this.ADMIN_NAME,
      username: this.ADMIN_USERNAME,
      password: hashedPassword,
    });

    await this.userRepository.save(adminUser);
    this.logger.log(`✅ Usuario ${this.ADMIN_USERNAME} creado exitosamente`);
    this.logger.log(
      `   Credenciales: ${this.ADMIN_USERNAME} / ${this.ADMIN_PASSWORD}`
    );
  }
}
