import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AUTH_SERVICE, GOOGLE_PROVIDER } from '../constants';
import { UserWithoutPassword } from '../contracts/user';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(AUTH_SERVICE) private readonly authService: ClientProxy,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id: providerId, name, emails } = profile;
    const user = await lastValueFrom(
      this.authService
        .send<UserWithoutPassword>('validate_user_oauth', {
          provider: GOOGLE_PROVIDER,
          providerId,
          username: name.givenName, // name.givenName + name.familyName
          email: emails[0].value,
        })
        .pipe(
          catchError((error) => {
            throw new HttpException(error.message, error.statusCode);
          }),
        ),
    );

    done(null, user);
  }
}
