import { Logger, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmConfigModule } from '@app/common/database/config';
import { RmqModule } from '@app/rmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentTransactionEntity } from '@app/common/database/entities';
import { PAYMENT_PROVIDER } from './constants';
import { FakePaymentProvider } from './payment_providers/fake-payment.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/payment/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_PAYMENT_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([PaymentTransactionEntity]),
    RmqModule,
  ],
  controllers: [PaymentController],
  providers: [
    Logger,
    PaymentService,
    { provide: PAYMENT_PROVIDER, useClass: FakePaymentProvider }, // TODO: Replace with real payment provider
  ],
})
export class PaymentModule {}
