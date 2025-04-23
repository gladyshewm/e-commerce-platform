import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions, RpcException } from '@nestjs/microservices';
import { getRmqOptions } from '@app/rmq';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from '@app/logger';
import { ValidationPipe } from '@nestjs/common';
import { RmqAckFilter } from '@app/common/filters';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(UserModule);
  const configService = appContext.get(ConfigService);

  const rmqUri = configService.get<string>('RMQ_URI');
  const queue = configService.get<string>('RMQ_USER_QUEUE');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserModule,
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
