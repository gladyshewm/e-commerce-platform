import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { RmqModule } from '@app/rmq';
import { ORDER_SERVICE } from '@app/common/constants';

@Module({
  imports: [RmqModule.register({ name: ORDER_SERVICE })],
  controllers: [OrderController],
  providers: [],
})
export class OrderModule {}
