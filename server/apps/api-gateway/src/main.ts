import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@app/logger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });
  const configService = app.get(ConfigService);
  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription(
      'Centralized API gateway for interacting with e-commerce microservices',
    )
    .setVersion('1.0')
    .addTag('auth', 'User authentication and authorization')
    .addTag('users', 'User management')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
