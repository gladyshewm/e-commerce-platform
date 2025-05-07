import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ORDER_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '@app/common/auth';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '@app/common/contracts/user';
import { CreateOrderDto } from './dto/order-create.dto';
import { lastValueFrom } from 'rxjs';
import { handleRpcError } from '../common/utils/rpc-exception.utils';
import { Order } from '@app/common/contracts/order';
import { OrderDto } from './dto/order.dto';

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
    @CurrentUser() user: Pick<User, 'id' | 'username'>,
  ) {
    return lastValueFrom<Order>(
      this.orderServiceClient
        .send('create_order', {
          ...dto,
          userId: user.id,
        })
        .pipe(handleRpcError()),
    );
  }
}
