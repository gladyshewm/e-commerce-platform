import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE, USER_SERVICE } from '@app/common/constants';
import { JwtStrategy, LocalStrategy } from '@app/common/auth';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().required().default(3000),
      }),
    }),
    RmqModule.register({ name: AUTH_SERVICE }),
    RmqModule.register({ name: USER_SERVICE }),
  ],
  controllers: [ApiGatewayController],
  providers: [JwtStrategy, LocalStrategy],
})
export class ApiGatewayModule {}
