import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  EmailVerificationTokenEntity,
  UserEntity,
} from '@app/common/database/entities';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(EmailVerificationTokenEntity)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationTokenEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async cleanExpiredTokens() {
    try {
      await this.emailVerificationTokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });
      this.logger.log('Deleted expired email verification tokens');
    } catch (error) {
      this.logger.error(
        `Failed to delete expired email verification tokens: ${error.message}`,
        error.stack,
      );
    }
  }

  async createToken(userId: number): Promise<string> {
    try {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

      const emailVerificationToken =
        this.emailVerificationTokenRepository.create({
          token,
          expiresAt,
          user: { id: userId },
        });

      await this.emailVerificationTokenRepository.save(emailVerificationToken);
      return token;
    } catch (error) {
      this.logger.error(`Failed to create email verification token: ${error}`);
      throw new RpcException({
        message: `Failed to create email verification token: ${error.message}`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async activateEmail(token: string): Promise<void> {
    const tokenEntity = await this.emailVerificationTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
      this.logger.error(
        `Failed to activate user email: Email verification token is ${!tokenEntity ? 'invalid' : 'expired'}`,
      );
      throw new RpcException({
        message: `Email verification token is ${!tokenEntity ? 'invalid' : 'expired'}`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const user = tokenEntity.user;

    if (user.isEmailVerified) {
      this.logger.error(
        `Email of the user with ID ${user.id} is already verified`,
      );
      await this.emailVerificationTokenRepository.remove(tokenEntity);
      throw new RpcException({
        message: `Email of the user with ID ${user.id} is already verified`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    user.isEmailVerified = true;
    await this.userRepository.save(user);
    await this.emailVerificationTokenRepository.remove(tokenEntity);

    this.logger.log(
      `Email of the user with ID ${user.id} has been successfully activated`,
    );
  }
}
