import { Controller } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { BaseRpcController, RmqService } from '@app/rmq';
import {
  AddStockPayload,
  ProductCreatedPayload,
} from '@app/common/contracts/inventory';

@Controller()
export class InventoryController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly inventoryService: InventoryService,
  ) {
    super(rmqService);
  }

  @EventPattern('product_created')
  async handleProductCreated(
    @Payload() payload: ProductCreatedPayload,
    @Ctx() ctx: RmqContext,
  ) {
    this.handleMessage(ctx, () =>
      this.inventoryService.createInventory(payload),
    );
  }

  @MessagePattern('add_stock')
  async addStock(@Payload() payload: AddStockPayload, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.addStock(payload),
    );
  }

  // TODO: reserve, releaseReserve, commitReserve
}
