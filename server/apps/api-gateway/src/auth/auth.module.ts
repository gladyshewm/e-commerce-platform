import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { RmqModule } from '@app/rmq';
import { AUTH_SERVICE } from '@app/common/constants';
import {
  GithubStrategy,
  GoogleStrategy,
  LocalStrategy,
} from '../common/strategies';
import { GoogleOauthController } from './google-oauth.controller';
import { GithubOauthController } from './github-oauth.controller';

@Module({
  imports: [RmqModule.register({ name: AUTH_SERVICE })],
  controllers: [AuthController, GoogleOauthController, GithubOauthController],
  providers: [LocalStrategy, GoogleStrategy, GithubStrategy],
})
export class AuthModule {}
