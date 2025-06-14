import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { catchError, lastValueFrom } from 'rxjs';
import { Profile, Strategy } from 'passport-github2';
import { AUTH_SERVICE } from '@app/common/constants';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { AuthCommands } from '@app/common/messaging';
import { GITHUB_PROVIDER } from '../constants';
import { AuthenticatedUser } from '../types';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(AUTH_SERVICE) private readonly authService: ClientProxy,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<AuthenticatedUser> {
    const { id: providerId, username, emails } = profile;
    const email = emails[0].value;
    const user = await lastValueFrom(
      this.authService
        .send<UserWithoutPassword>(AuthCommands.ValidateUserOAuth, {
          provider: GITHUB_PROVIDER,
          providerId,
          username,
          email,
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(error.message, error.statusCode);
          }),
        ),
    );

    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }
}
