import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  JwtPayload,
  LoginResponse,
  RefreshPayload,
} from '@app/common/contracts/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenEntity } from '@app/common/database/entities';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetTokensPayload } from './types/get-tokens-payload.interface';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenRepository: Repository<TokenEntity>,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async cleanExpiredTokens(): Promise<void> {
    try {
      await this.tokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });
      this.logger.log('Deleted expired tokens');
    } catch (error) {
      this.logger.error(
        `Failed to delete expired tokens: ${error.message}`,
        error.stack,
      );
    }
  }

  async getTokens(payload: GetTokensPayload): Promise<LoginResponse> {
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

  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const userData = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return userData;
    } catch (error) {
      this.logger.error(
        `Failed to verify access token: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const userData = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      return userData;
    } catch (error) {
      this.logger.error(
        `Failed to verify refresh token: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async findToken(refreshToken: string): Promise<TokenEntity | null> {
    const payload = this.jwtService.decode<JwtPayload>(refreshToken);

    if (!payload || !payload.userId) {
      this.logger.error(
        `Failed to find token: ${!payload ? 'Invalid token' : 'User ID not found in token'}`,
      );
      return null;
    }

    const tokens = await this.tokenRepository.find({
      where: { user: { id: payload.userId } },
      relations: ['user'],
    });

    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.refreshToken);
      if (isMatch) {
        return token;
      }
    }

    this.logger.error(`Failed to find token: Token not found`);
    return null;
  }

  async updateRefreshToken(
    payload: RefreshPayload & { userId: number },
  ): Promise<void> {
    try {
      const { userId, refreshToken, ipAddress, userAgent } = payload;
      const hashed = await bcrypt.hash(refreshToken, 10);

      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days FIXME:
      const token = this.tokenRepository.create({
        user: { id: userId },
        refreshToken: hashed,
        expiresAt,
        ipAddress,
        userAgent,
      });

      await this.tokenRepository.save(token);
      this.logger.log(`Updated refresh token for user with ID ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update refresh token: ${error.message}`,
        error.stack,
      );
    }
  }

  async removeRefreshToken(refreshToken: string): Promise<void> {
    const token = await this.findToken(refreshToken);

    if (!token) {
      this.logger.error(`Failed to remove refresh token: Token not found`);
      return;
    }

    await this.tokenRepository.delete({ id: token.id });
    this.logger.log(`Removed refresh token for user with ID ${token.user.id}`);
  }

  async removeRefreshTokenById(refreshTokenId: number): Promise<void> {
    try {
      await this.tokenRepository.delete({ id: refreshTokenId });
      this.logger.log(`Removed refresh token with ID ${refreshTokenId}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove refresh token with ID ${refreshTokenId}: ${error.message}`,
        error.stack,
      );
    }
  }

  async removeAllRefreshTokens(refreshToken: string): Promise<void> {
    const payload = this.jwtService.decode<JwtPayload>(refreshToken);

    if (!payload || !payload.userId) {
      this.logger.error(
        `Failed to remove all refresh tokens: ${!payload ? 'Invalid token' : 'User ID not found in token'}`,
      );
      return;
    }

    await this.tokenRepository.delete({ user: { id: payload.userId } });
    this.logger.log(
      `Removed all refresh tokens for user with ID ${payload.userId}`,
    );
  }
}
