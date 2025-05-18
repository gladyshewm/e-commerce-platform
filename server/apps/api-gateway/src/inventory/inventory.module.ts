import { Module } from '@nestjs/common';
import { RmqModule } from '@app/rmq';
import { INVENTORY_SERVICE } from '@app/common/constants';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [RmqModule.register({ name: INVENTORY_SERVICE })],
  controllers: [InventoryController],
  providers: [],
})
export class InventoryModule {}
