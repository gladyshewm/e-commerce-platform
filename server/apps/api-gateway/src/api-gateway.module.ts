import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/api-gateway/.env',
      validationSchema: Joi.object({
        PORT: Joi.number().required().default(3000),
      }),
    }),
    HttpModule,
  ],
  controllers: [ApiGatewayController],
  providers: [],
})
export class ApiGatewayModule {}
