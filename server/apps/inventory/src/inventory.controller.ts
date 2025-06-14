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
import { InventoryCommands, ProductEvents } from '@app/common/messaging';
import { AddStockDto } from './dto/inventory-add-stock.dto';
import { CreateInventoryDto } from './dto/inventory-create.dto';
import { GetInventoryByProductIdDto } from './dto/inventory-get-by-productid.dto';

@Controller()
export class InventoryController extends BaseRpcController {
  constructor(
    rmqService: RmqService,
    private readonly inventoryService: InventoryService,
  ) {
    super(rmqService);
  }

  @EventPattern(ProductEvents.Created)
  async handleProductCreated(
    @Payload() payload: CreateInventoryDto,
    @Ctx() ctx: RmqContext,
  ) {
    await this.handleMessage(ctx, () =>
      this.inventoryService.createInventory(payload),
    );
  }

  @MessagePattern(InventoryCommands.GetAll)
  async getInventories(@Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.getInventories(),
    );
  }

  @MessagePattern(InventoryCommands.GetByProductId)
  async getInventoryByProductId(
    @Payload() payload: GetInventoryByProductIdDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.getInventoryByProductId(payload),
    );
  }

  @MessagePattern(InventoryCommands.AddStock)
  async addStock(@Payload() payload: AddStockDto, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.addStock(payload),
    );
  }

  @MessagePattern(InventoryCommands.Reserve)
  async reserveOne(@Payload() payload: AddStockDto, @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.reserveOne(payload),
    );
  }

  @MessagePattern(InventoryCommands.ReserveMany)
  async reserveMany(@Payload() payload: AddStockDto[], @Ctx() ctx: RmqContext) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.reserveMany(payload),
    );
  }

  @MessagePattern(InventoryCommands.CommitReserve)
  async commitReserveOne(
    @Payload() payload: AddStockDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.commitReserveOne(payload),
    );
  }

  @MessagePattern(InventoryCommands.CommitReserveMany)
  async commitReserveMany(
    @Payload() payload: AddStockDto[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.commitReserveMany(payload),
    );
  }

  @MessagePattern(InventoryCommands.ReleaseReserve)
  async releaseReserveOne(
    @Payload() payload: AddStockDto,
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.releaseReserveOne(payload),
    );
  }

  @MessagePattern(InventoryCommands.ReleaseReserveMany)
  async releaseReserveMany(
    @Payload() payload: AddStockDto[],
    @Ctx() ctx: RmqContext,
  ) {
    return this.handleMessage(ctx, () =>
      this.inventoryService.releaseReserveMany(payload),
    );
  }
}
