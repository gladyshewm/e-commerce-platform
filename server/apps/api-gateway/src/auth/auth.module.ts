import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE } from '@app/common/constants';
import {
  GithubStrategy,
  GoogleStrategy,
  LocalStrategy,
} from '../common/strategies';

@Module({
  imports: [RmqModule.register({ name: AUTH_SERVICE })],
  controllers: [AuthController],
  providers: [LocalStrategy, GoogleStrategy, GithubStrategy],
})
export class AuthModule {}
