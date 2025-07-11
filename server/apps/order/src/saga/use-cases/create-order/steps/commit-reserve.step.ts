import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { catchError, lastValueFrom } from 'rxjs';
import { AddStockPayload } from '@app/common/contracts/inventory';
import { INVENTORY_SERVICE } from '@app/common/constants';
import { InventoryCommands } from '@app/common/messaging';
import { COMMIT_RESERVE_STEP } from '../constants';
import { SagaStep } from '../../../saga-step';
import { OrderSagaContext } from '../../../types/order-saga-ctx.interface';

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
      this.inventoryServiceClient
        .send(InventoryCommands.CommitReserveMany, payload)
        .pipe(
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
