import { Inject, Injectable } from '@nestjs/common';
import { USER_SERVICE } from '@app/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse, User, ValidateUserResponse } from '@app/common/types';
import { ValidateUserPayload } from './types/validate-user-payload.interface';
import { LoginPayload } from './types/login-payload.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    payload: ValidateUserPayload,
  ): Promise<ValidateUserResponse> {
    const { username, password } = payload;
    const user = await lastValueFrom(
      this.userServiceClient.send<User>('get_user_by_name', {
        username,
      }),
    );
    const isMatch = await bcrypt.compare(password, user.password);
    if (user && isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginPayload: LoginPayload): Promise<LoginResponse> {
    const payload = {
      username: loginPayload.username,
      sub: loginPayload.userId,
    };
    return { access_token: this.jwtService.sign(payload) };
  }
}
