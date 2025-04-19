import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { JwtStrategy } from '@app/common/auth';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().required().default(3000),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_SECRET_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET_EXPIRATION_TIME: Joi.string().required(),
        RMQ_URI: Joi.string().required(),
        RMQ_AUTH_QUEUE: Joi.string().required(),
        RMQ_USER_QUEUE: Joi.string().required(),
        RMQ_PRODUCT_QUEUE: Joi.string().required(),
        RMQ_ORDER_QUEUE: Joi.string().required(),
        RMQ_INVENTORY_QUEUE: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST');
        const redisPort = configService.get<number>('REDIS_PORT');
        return {
          throttlers: [
            {
              ttl: seconds(60),
              limit: 10,
            },
          ],
          errorMessage: 'Too many requests',
          storage: new ThrottlerStorageRedisService(
            `${redisHost}:${redisPort}`,
          ),
        };
      },
    }),
    AuthModule,
    UserModule,
    ProductModule,
    InventoryModule,
    OrderModule,
  ],
  providers: [
    Logger,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiGatewayModule {}
