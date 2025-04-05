import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { RmqModule } from '@app/rmq';
import { USER_SERVICE } from './constants/services.constant';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().required().default(3000),
      }),
    }),
    RmqModule.register({ name: USER_SERVICE }),
  ],
  controllers: [ApiGatewayController],
  providers: [],
})
export class ApiGatewayModule {}
