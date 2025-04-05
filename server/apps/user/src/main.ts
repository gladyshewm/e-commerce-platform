import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRmqOptions } from '@app/rmq';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(UserModule);
  const configService = appContext.get(ConfigService);

  const rmqUri = configService.get<string>('RMQ_URI');
  const queue = configService.get<string>('RMQ_USER_QUEUE');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
    getRmqOptions(rmqUri, queue),
  );

  await app.listen();
}
bootstrap();
