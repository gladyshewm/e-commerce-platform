import {
  Body,
  Controller,
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
import { INVENTORY_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { handleRpcError } from '../common/utils/rpc-exception.utils';
import { AddStockDto } from './dto/inventory-add-stock.dto';
import { JwtAuthGuard } from '@app/common/auth';
import { InventoryDto } from './dto/inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    @Inject(INVENTORY_SERVICE)
    private readonly inventoryServiceClient: ClientProxy,
  ) {}

  @Patch(':productId/add-stock')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Increase the quantity of the product in stock' })
  @ApiResponse({
    status: 200,
    type: InventoryDto,
    description: 'Returns the updated inventory',
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
