import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().required().default(3000),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_SECRET_EXPIRATION_TIME: Joi.string().required(),
        RMQ_URI: Joi.string().required(),
        RMQ_USER_QUEUE: Joi.string().required(),
        RMQ_AUTH_QUEUE: Joi.string().required(),
      }),
    }),
    AuthModule,
    UserModule,
  ],
})
export class ApiGatewayModule {}
