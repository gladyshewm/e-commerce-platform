import { Logger, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RmqModule } from '@app/rmq';
import { OrderEntity } from '@app/common/database/entities';
import { TypeOrmConfigModule } from '@app/common/database/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/order/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_ORDER_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([OrderEntity]),
    RmqModule,
  ],
  controllers: [OrderController],
  providers: [Logger, OrderService],
})
export class OrderModule {}
