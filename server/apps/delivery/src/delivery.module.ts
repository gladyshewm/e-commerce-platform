import { Logger, Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { RmqModule } from '@app/rmq';
import { TypeOrmConfigModule } from '@app/common/database/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryEntity } from '@app/common/database/entities';
import { NOTIFICATION_SERVICE, ORDER_SERVICE } from '@app/common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/delivery/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_DELIVERY_QUEUE: Joi.string().required(),
        RMQ_NOTIFICATION_QUEUE: Joi.string().required(),
        RMQ_ORDER_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([DeliveryEntity]),
    RmqModule,
    RmqModule.register({ name: NOTIFICATION_SERVICE }),
    RmqModule.register({ name: ORDER_SERVICE }),
  ],
  controllers: [DeliveryController],
  providers: [Logger, DeliveryService],
})
export class DeliveryModule {}
