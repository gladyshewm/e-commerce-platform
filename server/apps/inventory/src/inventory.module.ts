import { Logger, Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmConfigModule } from '@app/common/database/config';
import { RmqModule } from '@app/rmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryEntity } from '@app/common/database/entities';
import { PRODUCT_SERVICE } from '@app/common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/inventory/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_INVENTORY_QUEUE: Joi.string().required(),
        RMQ_PRODUCT_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([InventoryEntity]),
    RmqModule,
    RmqModule.register({ name: PRODUCT_SERVICE }),
  ],
  controllers: [InventoryController],
  providers: [Logger, InventoryService],
})
export class InventoryModule {}
