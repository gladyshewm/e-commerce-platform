import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LocalStrategy } from '@app/common/auth';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE } from '@app/common/constants';

@Module({
  imports: [RmqModule.register({ name: AUTH_SERVICE })],
  controllers: [AuthController],
  providers: [LocalStrategy],
})
export class AuthModule {}
