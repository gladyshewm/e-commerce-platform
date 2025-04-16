import { Module } from '@nestjs/common';
import { RmqModule } from '@app/rmq';
import { USER_SERVICE } from '@app/common/constants';
import { UserController } from './user.controller';

@Module({
  imports: [RmqModule.register({ name: USER_SERVICE })],
  controllers: [UserController],
  providers: [],
})
export class UserModule {}
