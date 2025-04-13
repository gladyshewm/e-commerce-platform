import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LocalStrategy } from '@app/common/auth';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE } from '@app/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [RmqModule.register({ name: AUTH_SERVICE })],
  controllers: [AuthController],
  providers: [
    Logger,
    LocalStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AuthModule {}
