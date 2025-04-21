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

  @MessagePattern('reserve')
  async reserve(@Payload() payload: AddStockPayload, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.reserve(payload),
    );
  }

  @MessagePattern('reserve_many')
  async reserveMany(
    @Payload() payload: AddStockPayload[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.reserveMany(payload),
    );
  }

  @MessagePattern('commit_reserve')
  async commitReserve(
    @Payload() payload: AddStockPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.commitReserve(payload),
    );
  }

  @MessagePattern('commit_reserve_many')
  async commitReserveMany(
    @Payload() payload: AddStockPayload[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.commitReserveMany(payload),
    );
  }

  @MessagePattern('release_reserve')
  async releaseReserve(
    @Payload() payload: AddStockPayload,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.releaseReserve(payload),
    );
  }

  @MessagePattern('release_reserve_many')
  async releaseReserveMany(
    @Payload() payload: AddStockPayload[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.releaseReserveMany(payload),
    );
  }
}
