import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { USER_SERVICE } from '@app/common/constants';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  LoginResponse,
  LoginPayload,
  ValidateUserPayload,
  ValidateUserResponse,
} from '@app/common/contracts/auth';
import { User } from '@app/common/contracts/user';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_SERVICE) private readonly userServiceClient: ClientProxy,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(
    payload: ValidateUserPayload,
  ): Promise<ValidateUserResponse> {
    const { username, password } = payload;
    const user = await lastValueFrom(
      this.userServiceClient.send<User | null>('get_user_by_name', {
        username,
      }),
    );

    if (!user) {
      this.logger.error(`Failed to validate user: Invalid credentials`);
      throw new RpcException({
        message: 'Invalid credentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      this.logger.error(`Failed to validate user: Invalid credentials`);
      throw new RpcException({
        message: 'Invalid credentials',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginPayload: LoginPayload): Promise<LoginResponse> {
    // TODO:
    // const tokens = await this.getTokens(
    //   String(loginPayload.userId),
    //   loginPayload.username,
    // );
    // await this.updateRefreshToken(
    //   String(loginPayload.userId),
    //   tokens.refreshToken,
    // );
    const payload = {
      username: loginPayload.username,
      sub: loginPayload.userId,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  ///////////////////////// TODO: refresh

  async getTokens(userId: string, username: string) {
    const payload = { sub: userId, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string | number>(
          'JWT_ACCESS_SECRET_EXPIRATION_TIME',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string | number>(
          'JWT_REFRESH_SECRET_EXPIRATION_TIME',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    await lastValueFrom(
      this.userServiceClient.emit('update_refresh_token', {
        userId,
        hashedRefreshToken: hashed,
      }),
    );
  }

  async removeRefreshToken(userId: string) {
    await lastValueFrom(
      this.userServiceClient.emit('remove_refresh_token', {
        userId,
      }),
    );
  }
}
