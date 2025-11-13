import { Global, Module } from '@nestjs/common';
import { AreasModule } from '../../areas/areas.module';
import { DepartmentsModule } from '../../departments/departments.module';
import { TorretasModule } from '../../torretas/torretas.module';
import { TorretaColorsModule } from '../../torreta-colors/torreta-colors.module';
import { ReceptorsModule } from '../../receptors/receptors.module';
import { EmailsModule } from '../../emails/emails.module';
import { EventsModule } from '../../events/events.module';

@Global()
@Module({
  imports: [
    AreasModule,
    DepartmentsModule,
    TorretasModule,
    TorretaColorsModule,
    ReceptorsModule,
    EmailsModule,
    EventsModule,
  ],
  exports: [
    AreasModule,
    DepartmentsModule,
    TorretasModule,
    TorretaColorsModule,
    ReceptorsModule,
    EmailsModule,
    EventsModule,
  ],
})
export class CatalogsGlobalModule {}
