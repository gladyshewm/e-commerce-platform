import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { INVENTORY_SERVICE } from '@app/common/constants';
import { AddStockPayload } from '@app/common/contracts/inventory';
import { InventoryCommands } from '@app/common/messaging';
import { SagaStep } from '../../../saga-step';
import { OrderSagaContext } from '../../../types/order-saga-ctx.interface';
import { RELEASE_ITEMS_STEP } from '../constants';

@Injectable()
export class ReleaseItemsStep extends SagaStep<OrderSagaContext> {
  readonly name = RELEASE_ITEMS_STEP;
  private readonly logger = new Logger(ReleaseItemsStep.name);

  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryServiceClient: ClientProxy,
  ) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    this.logger.log(
      `Releasing reserved items for order with ID ${context.order.id}`,
    );
    const payload: AddStockPayload[] = context.order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await lastValueFrom(
      this.inventoryServiceClient
        .send(InventoryCommands.ReleaseReserveMany, payload)
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
    this.logger.log(`Re-reserving items for order with ID ${context.order.id}`);
    const payload: AddStockPayload[] = context.order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await lastValueFrom(
      this.inventoryServiceClient
        .send(InventoryCommands.ReserveMany, payload)
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
}
