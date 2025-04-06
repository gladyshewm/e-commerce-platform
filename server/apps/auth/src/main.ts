import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRmqOptions } from '@app/rmq';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const configService = appContext.get(ConfigService);

  const rmqUri = configService.get<string>('RMQ_URI');
  const queue = configService.get<string>('RMQ_AUTH_QUEUE');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    getRmqOptions(rmqUri, queue),
  );

  await app.listen();
}
bootstrap();
