import { Logger, Module } from '@nestjs/common';
import { JwtStrategy } from '@app/common/auth';
import { RmqModule } from '@app/rmq';
import { USER_SERVICE } from '@app/common/constants';
import { UserController } from './user.controller';

@Module({
  imports: [RmqModule.register({ name: USER_SERVICE })],
  controllers: [UserController],
  providers: [Logger, JwtStrategy],
})
export class UserModule {}
