import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { INVENTORY_SERVICE } from '@app/common/constants';
import { UserRole } from '@app/common/database/enums';
import { AddStockDto } from './dto/inventory-add-stock.dto';
import { InventoryDto } from './dto/inventory.dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';
import { handleRpcError } from '../common/utils';

@ApiTags('inventories')
@Controller('inventories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.ADMIN)
export class InventoryController {
  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryServiceClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventories' })
  @ApiResponse({
    status: 200,
    type: [InventoryDto],
    description: 'Returns all inventories',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
  })
  @ApiBearerAuth()
  async getInventories(): Promise<InventoryDto[]> {
    return lastValueFrom(
      this.inventoryServiceClient
        .send('get_inventories', {})
        .pipe(handleRpcError()),
    );
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get the inventory of the product' })
  @ApiResponse({
    status: 200,
    type: InventoryDto,
    description: 'Returns the inventory of the product',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
  })
  @ApiResponse({
    status: 404,
    description: 'Inventory for product with this id not found',
  })
  @ApiBearerAuth()
  async getInventoryByProductId(
    @Param('productId') productId: number,
  ): Promise<InventoryDto> {
    return lastValueFrom(
      this.inventoryServiceClient
        .send('get_inventory', { productId })
        .pipe(handleRpcError()),
    );
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Increase the quantity of the product in stock' })
  @ApiResponse({
    status: 200,
    type: InventoryDto,
    description: 'Returns the updated inventory',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied for your role',
  })
  @ApiResponse({
    status: 404,
    description: 'Inventory for product with this id not found',
  })
  @ApiBearerAuth()
  async addStock(
    @Param('productId') productId: number,
    @Body() dto: AddStockDto,
  ): Promise<InventoryDto> {
    return lastValueFrom(
      this.inventoryServiceClient
        .send('add_stock', { productId, ...dto })
        .pipe(handleRpcError()),
    );
  }
}
