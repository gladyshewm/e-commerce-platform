import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { catchError, lastValueFrom } from 'rxjs';
import { Profile, Strategy } from 'passport-github2';
import { AUTH_SERVICE } from '@app/common/constants';
import { UserWithoutPassword } from '@app/common/contracts/user';
import { GITHUB_PROVIDER } from '../constants';

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
  ) {
    const { id: providerId, username, emails } = profile;
    const email = emails[0].value;
    const user = await lastValueFrom(
      this.authService
        .send<UserWithoutPassword>('validate_user_oauth', {
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

    return user;
  }
}
