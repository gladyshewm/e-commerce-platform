import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom } from 'rxjs';
import { AUTH_SERVICE } from '@app/common/constants';
import { ValidateUserResponse } from '@app/common/contracts/auth';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(AUTH_SERVICE) private readonly authService: ClientProxy) {
    super();
  }

  async validate(
    username: string,
    password: string,
  ): Promise<ValidateUserResponse> {
    return lastValueFrom<ValidateUserResponse>(
      this.authService.send('validate_user', { username, password }).pipe(
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );
  }
}
