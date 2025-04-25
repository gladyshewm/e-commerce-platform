import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, RpcException } from '@nestjs/microservices';
import { getRmqOptions } from '@app/rmq';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@app/logger';
import { ValidationPipe } from '@nestjs/common';
import { RmqAckFilter } from '@app/common/filters';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(PaymentModule);
  const configService = appContext.get(ConfigService);

  const rmqUri = configService.get<string>('RMQ_URI');
  const queue = configService.get<string>('RMQ_PAYMENT_QUEUE');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      ...getRmqOptions(rmqUri, queue),
      logger: WinstonModule.createLogger(winstonConfig),
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const validationErrors = errors.flatMap((err) =>
          Object.values(err.constraints),
        );
        return new RpcException({
          statusCode: 400,
          message: 'Validation failed',
          errors: validationErrors,
        });
      },
    }),
  );
  app.useGlobalFilters(new RmqAckFilter());

  await app.listen();
}
bootstrap();
