import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import * as Joi from 'joi';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TypeOrmConfigModule } from '@app/common/database/config';
import { RmqModule } from '@app/rmq';
import { NotificationEntity } from '@app/common/database/entities';
import { USER_SERVICE } from '@app/common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/notification/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_NOTIFICATION_QUEUE: Joi.string().required(),
        RMQ_USER_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.string().required(),
        MAIL_USER: Joi.string().required(),
        MAIL_PASSWORD: Joi.string().required(),
        MAIL_SENDER: Joi.string().required(),
      }),
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<string>('MAIL_PORT'),
          secure: false,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_SENDER'),
        },
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([NotificationEntity]),
    RmqModule,
    RmqModule.register({ name: USER_SERVICE }),
  ],
  controllers: [NotificationController],
  providers: [Logger, NotificationService],
})
export class NotificationModule {}
