import { ClientProxy, RpcException } from '@nestjs/microservices';
import { COMMIT_RESERVE_STEP } from '../constants';
import { OrderSagaContext } from '../../order-saga-ctx.interface';
import { SagaStep } from './saga-step';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AddStockPayload } from '@app/common/contracts/inventory';
import { catchError, lastValueFrom } from 'rxjs';
import { INVENTORY_SERVICE } from '@app/common/constants';

@Injectable()
export class CommitReserveStep extends SagaStep<OrderSagaContext> {
  readonly name = COMMIT_RESERVE_STEP;
  private readonly logger = new Logger(CommitReserveStep.name);

  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryServiceClient: ClientProxy,
  ) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    this.logger.log(`Committing reserve for order with ID ${context.order.id}`);
    const payload: AddStockPayload[] = context.order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await lastValueFrom(
      this.inventoryServiceClient.send('commit_reserve_many', payload).pipe(
        catchError((error) => {
          throw new RpcException({
            message: error.message,
            statusCode: error.statusCode,
          });
        }),
      ),
    );
  }

  async compensate(context: OrderSagaContext): Promise<void> {
    // не требуется
    this.logger.log(
      `Rolling back reserve for order with ID ${context.order.id}`,
    );
  }
}
