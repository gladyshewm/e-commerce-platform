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
import { AddStockDto } from './dto/inventory-add-stock.dto';
import { CreateInventoryDto } from './dto/inventory-create.dto';

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
    @Payload() payload: CreateInventoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.inventoryService.createInventory(payload),
    );
  }

  @MessagePattern('add_stock')
  async addStock(@Payload() payload: AddStockDto, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.addStock(payload),
    );
  }

  @MessagePattern('reserve')
  async reserveOne(@Payload() payload: AddStockDto, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.reserveOne(payload),
    );
  }

  @MessagePattern('reserve_many')
  async reserveMany(@Payload() payload: AddStockDto[], @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.reserveMany(payload),
    );
  }

  @MessagePattern('commit_reserve')
  async commitReserveOne(
    @Payload() payload: AddStockDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.commitReserveOne(payload),
    );
  }

  @MessagePattern('commit_reserve_many')
  async commitReserveMany(
    @Payload() payload: AddStockDto[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.commitReserveMany(payload),
    );
  }

  @MessagePattern('release_reserve')
  async releaseReserveOne(
    @Payload() payload: AddStockDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.releaseReserveOne(payload),
    );
  }

  @MessagePattern('release_reserve_many')
  async releaseReserveMany(
    @Payload() payload: AddStockDto[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.releaseReserveMany(payload),
    );
  }
}
