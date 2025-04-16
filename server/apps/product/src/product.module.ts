import { Logger, Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmConfigModule } from '@app/common/database/config';
import { RmqModule } from '@app/rmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '@app/common/database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/product/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_PRODUCT_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([ProductEntity]),
    RmqModule,
  ],
  controllers: [ProductController],
  providers: [Logger, ProductService],
})
export class ProductModule {}
