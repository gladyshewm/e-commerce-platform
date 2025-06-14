import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ORDER_SERVICE } from '@app/common/constants';
import { Order } from '@app/common/contracts/order';
import { OrderCommands } from '@app/common/messaging';
import { CreateOrderDto } from './dto/order-create.dto';
import { OrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { handleRpcError } from '../common/utils';
import { AuthenticatedUser } from '../common/types';

@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiTags('orders')
export class OrderController {
  constructor(
    @Inject(ORDER_SERVICE) private readonly orderServiceClient: ClientProxy,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create order' })
  @ApiResponse({
    status: 201,
    type: OrderDto,
    description: 'Returns created order',
  })
  @ApiBearerAuth()
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return lastValueFrom<Order>(
      this.orderServiceClient
        .send(OrderCommands.Create, {
          ...dto,
          userId: user.id,
        })
        .pipe(handleRpcError()),
    );
  }

  // TODO: GET /orders/{id} — получить конкретный заказ, GET /orders — список заказов, PATCH /orders/{id} — обновить статус заказа ??
}
