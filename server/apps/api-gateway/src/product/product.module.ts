import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { RmqModule } from '@app/rmq';
import { PRODUCT_SERVICE } from '@app/common/constants';

@Module({
  imports: [RmqModule.register({ name: PRODUCT_SERVICE })],
  controllers: [ProductController],
})
export class ProductModule {}
