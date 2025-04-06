import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AUTH_SERVICE } from '../constants';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { ValidateUserResponse } from '../types';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: ClientProxy) {
    super();
  }

  async validate(
    username: string,
    password: string,
  ): Promise<ValidateUserResponse> {
    const user = await lastValueFrom<ValidateUserResponse>(
      this.authService.send('validate_user', { username, password }),
    );
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
