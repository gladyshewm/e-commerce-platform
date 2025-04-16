import { NestFactory } from '@nestjs/core';
import { ProductModule } from './product.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions } from '@nestjs/microservices';
import { getRmqOptions } from '@app/rmq';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@app/logger';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(ProductModule);
  const configService = appContext.get(ConfigService);

  const rmqUri = configService.get<string>('RMQ_URI');
  const queue = configService.get<string>('RMQ_PRODUCT_QUEUE');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductModule,
    {
      ...getRmqOptions(rmqUri, queue),
      logger: WinstonModule.createLogger(winstonConfig),
    },
  );

  await app.listen();
}
bootstrap();
