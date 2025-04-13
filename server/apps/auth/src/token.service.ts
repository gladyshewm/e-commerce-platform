import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from '@app/common/contracts/auth';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenEntity } from '@app/common/entities';
import { LessThan, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

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
  async cleanExpiredTokens() {
    await this.tokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    this.logger.log('Deleted expired tokens');
  }

  async getTokens(userId: string, username: string): Promise<LoginResponse> {
    const payload = { userId, username };

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

  async verifyAccessToken(token: string) {
    try {
      const userData = await this.jwtService.verifyAsync(token, {
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

  async verifyRefreshToken(token: string) {
    try {
      const userData = await this.jwtService.verifyAsync(token, {
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

  async findToken(refreshToken: string) {
    const payload = this.jwtService.decode(refreshToken) as { userId: string };

    if (!payload || !payload.userId) {
      this.logger.warn(`Failed to find token: User ID not found in token`);
      return null;
    }

    const tokens = await this.tokenRepository.find({
      where: { user: { id: +payload.userId } },
      relations: ['user'],
    });

    for (const token of tokens) {
      const isMatch = await bcrypt.compare(refreshToken, token.refreshToken);
      if (isMatch) {
        return token;
      }
    }

    this.logger.warn(`Failed to find token: Token not found`);
    return null;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days FIXME:
    const token = this.tokenRepository.create({
      user: { id: +userId },
      refreshToken: hashed,
      expiresAt,
    });

    await this.tokenRepository.save(token);
  }

  async removeRefreshToken(refreshToken: string) {
    const token = await this.findToken(refreshToken);
    if (!token) {
      this.logger.warn(`Failed to remove refresh token: Token not found`);
      return null;
    }

    await this.tokenRepository.delete({ id: token.id });
  }

  async removeRefreshTokenById(refreshTokenId: number) {
    await this.tokenRepository.delete({ id: refreshTokenId });
  }

  async removeAllRefreshTokens(refreshToken: string) {
    const payload = this.jwtService.decode(refreshToken) as { userId: string };

    if (!payload || !payload.userId) {
      this.logger.warn(`Failed to find token: User ID not found in token`);
      return null;
    }

    await this.tokenRepository.delete({ user: { id: +payload.userId } });
  }
}
