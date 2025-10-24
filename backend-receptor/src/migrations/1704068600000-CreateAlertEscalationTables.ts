import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertEscalationTables1704068600000
  implements MigrationInterface
{
  name = 'CreateAlertEscalationTables1704068600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create alert_escalation_configs table
    await queryRunner.query(`
            CREATE TABLE "alert_escalation_configs" (
                "id" SERIAL NOT NULL,
                "device_id" integer NOT NULL,
                "device_signal_id" integer NOT NULL,
                "endpoint_url" character varying(500) NOT NULL DEFAULT 'http://localhost:1880/events',
                "warning_delay_minutes" integer NOT NULL DEFAULT '20',
                "escalation1_delay_minutes" integer NOT NULL DEFAULT '40',
                "escalation2_delay_minutes" integer NOT NULL DEFAULT '60',
                "escalation3_delay_minutes" integer NOT NULL DEFAULT '80',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_alert_escalation_configs" PRIMARY KEY ("id")
            )
        `);

    // Create alert_escalation_messages table
    await queryRunner.query(`
            CREATE TYPE "public"."alert_escalation_messages_level_enum" AS ENUM('alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."alert_escalation_messages_message_type_enum" AS ENUM('torreta', 'receptor', 'email')
        `);
    await queryRunner.query(`
            CREATE TABLE "alert_escalation_messages" (
                "id" SERIAL NOT NULL,
                "escalation_config_id" integer NOT NULL,
                "level" "public"."alert_escalation_messages_level_enum" NOT NULL,
                "message_type" "public"."alert_escalation_messages_message_type_enum" NOT NULL,
                "target_id" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "color" character varying(7),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_alert_escalation_messages" PRIMARY KEY ("id")
            )
        `);

    // Create event_alert_logs table
    await queryRunner.query(`
            CREATE TYPE "public"."event_alert_logs_level_enum" AS ENUM('alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close')
        `);
    await queryRunner.query(`
            CREATE TABLE "event_alert_logs" (
                "id" SERIAL NOT NULL,
                "event_id" integer NOT NULL,
                "level" "public"."event_alert_logs_level_enum" NOT NULL,
                "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "messages_sent" jsonb NOT NULL,
                "success" boolean NOT NULL,
                "error_message" text,
                "endpoint_url" character varying(500) NOT NULL,
                CONSTRAINT "PK_event_alert_logs" PRIMARY KEY ("id")
            )
        `);

    // Create indexes
    await queryRunner.query(`
            CREATE INDEX "IDX_alert_escalation_configs_device_signal" ON "alert_escalation_configs" ("device_id", "device_signal_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_alert_escalation_messages_config_level" ON "alert_escalation_messages" ("escalation_config_id", "level")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_alert_logs_event_level" ON "event_alert_logs" ("event_id", "level")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_event_alert_logs_sent_at" ON "event_alert_logs" ("sent_at")
        `);

    // Create foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "alert_escalation_configs" 
            ADD CONSTRAINT "FK_alert_escalation_configs_device" 
            FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "alert_escalation_configs" 
            ADD CONSTRAINT "FK_alert_escalation_configs_device_signal" 
            FOREIGN KEY ("device_signal_id") REFERENCES "device_signals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "alert_escalation_messages" 
            ADD CONSTRAINT "FK_alert_escalation_messages_config" 
            FOREIGN KEY ("escalation_config_id") REFERENCES "alert_escalation_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "event_alert_logs" 
            ADD CONSTRAINT "FK_event_alert_logs_event" 
            FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "event_alert_logs" DROP CONSTRAINT "FK_event_alert_logs_event"`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_escalation_messages" DROP CONSTRAINT "FK_alert_escalation_messages_config"`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_escalation_configs" DROP CONSTRAINT "FK_alert_escalation_configs_device_signal"`
    );
    await queryRunner.query(
      `ALTER TABLE "alert_escalation_configs" DROP CONSTRAINT "FK_alert_escalation_configs_device"`
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_event_alert_logs_sent_at"`);
    await queryRunner.query(`DROP INDEX "IDX_event_alert_logs_event_level"`);
    await queryRunner.query(
      `DROP INDEX "IDX_alert_escalation_messages_config_level"`
    );
    await queryRunner.query(
      `DROP INDEX "IDX_alert_escalation_configs_device_signal"`
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "event_alert_logs"`);
    await queryRunner.query(`DROP TABLE "alert_escalation_messages"`);
    await queryRunner.query(`DROP TABLE "alert_escalation_configs"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."event_alert_logs_level_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."alert_escalation_messages_message_type_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."alert_escalation_messages_level_enum"`
    );
  }
}
