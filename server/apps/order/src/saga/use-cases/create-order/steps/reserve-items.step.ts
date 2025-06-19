import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { AddStockPayload } from '@app/common/contracts/inventory';
import { INVENTORY_SERVICE } from '@app/common/constants';
import { InventoryCommands } from '@app/common/messaging';
import { RESERVE_ITEMS_STEP } from '../constants';
import { SagaStep } from '../../../saga-step';
import { catchError, lastValueFrom } from 'rxjs';
import { OrderSagaContext } from '../../../types/order-saga-ctx.interface';

@Injectable()
export class ReserveItemsStep extends SagaStep<OrderSagaContext> {
  readonly name = RESERVE_ITEMS_STEP;
  private readonly logger = new Logger(ReserveItemsStep.name);

  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryServiceClient: ClientProxy,
  ) {
    super();
  }

  async invoke(context: OrderSagaContext): Promise<void> {
    this.logger.log(`Reserving items for order with ID ${context.order.id}`);
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

  async compensate(context: OrderSagaContext): Promise<void> {
    this.logger.log(
      `Releasing reserved items for order with ID ${context.order.id}`,
    );
    const payload: AddStockPayload[] = context.order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await lastValueFrom(
      this.inventoryServiceClient.send(
        InventoryCommands.ReleaseReserveMany,
        payload,
      ),
    );
  }
}
