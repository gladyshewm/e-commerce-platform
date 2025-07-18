import { Logger, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RmqModule } from '@app/rmq';
import { OrderEntity } from '@app/common/database/entities';
import { TypeOrmConfigModule } from '@app/common/database/config';
import * as Joi from 'joi';
import { OrderOrchestrator } from './saga/order.orchestrator';
import {
  DELIVERY_SERVICE,
  INVENTORY_SERVICE,
  NOTIFICATION_SERVICE,
  PAYMENT_SERVICE,
  PRODUCT_SERVICE,
} from '@app/common/constants';
import { CreateOrderSagaFactory } from './saga/use-cases/create-order/create-order-saga.factory';
import {
  CHARGE_PAYMENT_STEP,
  COMMIT_RESERVE_STEP,
  PLACE_ORDER_STEP,
  RESERVE_ITEMS_STEP,
} from './saga/use-cases/create-order/constants';
import { PlaceOrderStep } from './saga/use-cases/create-order/steps/place-order.step';
import { ReserveItemsStep } from './saga/use-cases/create-order/steps/reserve-items.step';
import { ChargePaymentStep } from './saga/use-cases/create-order/steps/charge-payment.step';
import { CommitReserveStep } from './saga/use-cases/create-order/steps/commit-reserve.step';
import { CancelOrderSagaFactory } from './saga/use-cases/cancel-order/cancel-order-saga.factory';
import {
  REFUND_STEP,
  RELEASE_ITEMS_STEP,
  UPDATE_STATUS_STEP,
} from './saga/use-cases/cancel-order/constants';
import { RefundStep } from './saga/use-cases/cancel-order/steps/refund.step';
import { ReleaseItemsStep } from './saga/use-cases/cancel-order/steps/release-items.step';
import { UpdateStatusStep } from './saga/use-cases/cancel-order/steps/update-status.step';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './apps/order/.env',
      validationSchema: Joi.object({
        RMQ_URI: Joi.string().required(),
        RMQ_ORDER_QUEUE: Joi.string().required(),
        RMQ_PRODUCT_QUEUE: Joi.string().required(),
        RMQ_INVENTORY_QUEUE: Joi.string().required(),
        RMQ_NOTIFICATION_QUEUE: Joi.string().required(),
        RMQ_PAYMENT_QUEUE: Joi.string().required(),
        RMQ_DELIVERY_QUEUE: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
      }),
    }),
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([OrderEntity]),
    RmqModule,
    RmqModule.register({ name: PRODUCT_SERVICE }),
    RmqModule.register({ name: INVENTORY_SERVICE }),
    RmqModule.register({ name: PAYMENT_SERVICE }),
    RmqModule.register({ name: DELIVERY_SERVICE }),
    RmqModule.register({ name: NOTIFICATION_SERVICE }),
  ],
  controllers: [OrderController],
  providers: [
    Logger,
    OrderService,
    OrderOrchestrator,
    CreateOrderSagaFactory,
    { provide: PLACE_ORDER_STEP, useClass: PlaceOrderStep },
    { provide: RESERVE_ITEMS_STEP, useClass: ReserveItemsStep },
    { provide: CHARGE_PAYMENT_STEP, useClass: ChargePaymentStep },
    { provide: COMMIT_RESERVE_STEP, useClass: CommitReserveStep },
    CancelOrderSagaFactory,
    { provide: REFUND_STEP, useClass: RefundStep },
    { provide: RELEASE_ITEMS_STEP, useClass: ReleaseItemsStep },
    { provide: UPDATE_STATUS_STEP, useClass: UpdateStatusStep },
  ],
})
export class OrderModule {}
