import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRmqOptions } from '@app/rmq';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@app/logger';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(OrderModule);
  const configService = appContext.get(ConfigService);

  const rmqUri = configService.get<string>('RMQ_URI');
  const queue = configService.get<string>('RMQ_ORDER_QUEUE');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderModule,
    {
      ...getRmqOptions(rmqUri, queue),
      logger: WinstonModule.createLogger(winstonConfig),
    },
  );

  await app.listen();
}
bootstrap();
