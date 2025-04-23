import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ORDER_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '@app/common/auth';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '@app/common/contracts/user';
import { CreateOrderDto } from './dto/order-create.dto';
import { lastValueFrom } from 'rxjs';
import { handleRpcError } from '../common/utils/rpc-exception.utils';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    @Inject(ORDER_SERVICE) private readonly orderServiceClient: ClientProxy,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: Pick<User, 'id' | 'username'>,
  ) {
    return lastValueFrom(
      this.orderServiceClient
        .send('create_order', {
          ...dto,
          userId: user.id,
        })
        .pipe(handleRpcError()),
    );
  }
}
