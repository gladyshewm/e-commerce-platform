import { Test, TestingModule } from '@nestjs/testing';
import { LessThan, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EmailVerificationService } from './email-verification.service';
import {
  EmailVerificationTokenEntity,
  UserEntity,
} from '@app/common/database/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';

jest.mock('uuid');

describe('EmailVerificationService', () => {
  let emailVerificationService: EmailVerificationService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let emailVerificationTokenRepository: jest.Mocked<
    Repository<EmailVerificationTokenEntity>
  >;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EmailVerificationTokenEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    emailVerificationService = app.get<EmailVerificationService>(
      EmailVerificationService,
    );
    userRepository = app.get<jest.Mocked<Repository<UserEntity>>>(
      getRepositoryToken(UserEntity),
    );
    emailVerificationTokenRepository = app.get<
      jest.Mocked<Repository<EmailVerificationTokenEntity>>
    >(getRepositoryToken(EmailVerificationTokenEntity));
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(emailVerificationService).toBeDefined();
    });
  });

  describe('cleanExpiredTokens', () => {
    it('should delete expired email verification tokens', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
      await emailVerificationService.cleanExpiredTokens();

      expect(emailVerificationTokenRepository.delete).toHaveBeenCalledWith({
        expiresAt: LessThan(new Date()),
      });

      jest.useRealTimers();
    });
  });

  describe('createToken', () => {
    let result: string;
    const userId = 666;
    const mockToken = 'email-verification-token';
    const emailVerificationToken = {
      id: 1,
      token: mockToken,
      user: { id: userId },
    } as EmailVerificationTokenEntity;

    beforeEach(async () => {
      (uuidv4 as jest.Mock).mockReturnValue(mockToken);
      emailVerificationTokenRepository.create.mockReturnValue(
        emailVerificationToken,
      );
      result = await emailVerificationService.createToken(userId);
    });

    it('should create email verification token', () => {
      expect(emailVerificationTokenRepository.create).toHaveBeenCalledWith({
        token: mockToken,
        expiresAt: expect.any(Date),
        user: { id: userId },
      });
    });

    it('should save email verification token in DB', () => {
      expect(emailVerificationTokenRepository.save).toHaveBeenCalledWith(
        emailVerificationToken,
      );
    });

    it('should return email verification token', () => {
      expect(result).toBe(mockToken);
    });

    it('should throw RpcException if failed to create email verification token', async () => {
      emailVerificationTokenRepository.save.mockRejectedValueOnce(
        new Error('save err'),
      );
      await expect(
        emailVerificationService.createToken(userId),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('activateEmail', () => {
    const token = 'email-verification-token';
    let emailVerificationToken: EmailVerificationTokenEntity;

    beforeEach(async () => {
      emailVerificationToken = {
        id: 1,
        token: token,
        user: { id: 225, isEmailVerified: false },
      } as EmailVerificationTokenEntity;
      emailVerificationTokenRepository.findOne.mockResolvedValue(
        emailVerificationToken,
      );
    });

    it('should throw RpcException if email verification token is invalid', async () => {
      emailVerificationTokenRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        emailVerificationService.activateEmail(token),
      ).rejects.toThrow(RpcException);
    });

    it('should throw RpcException if email verification token is expired', async () => {
      const expiredToken = {
        ...emailVerificationToken,
        expiresAt: new Date('1999-01-01'),
      };
      emailVerificationTokenRepository.findOne.mockResolvedValueOnce(
        expiredToken,
      );

      await expect(
        emailVerificationService.activateEmail(token),
      ).rejects.toThrow(RpcException);
    });

    it('should throw RpcException if user email already verified', async () => {
      const verifiedEmail = {
        ...emailVerificationToken,
        user: { ...emailVerificationToken.user, isEmailVerified: true },
      };
      emailVerificationTokenRepository.findOne.mockResolvedValueOnce(
        verifiedEmail,
      );

      await expect(
        emailVerificationService.activateEmail(token),
      ).rejects.toThrow(RpcException);
    });

    it('should update user email verification status', async () => {
      await emailVerificationService.activateEmail(token);

      expect(userRepository.save).toHaveBeenCalledWith({
        ...emailVerificationToken.user,
        isEmailVerified: true,
      });
    });

    it('should remove email verification token', async () => {
      await emailVerificationService.activateEmail(token);

      expect(emailVerificationTokenRepository.remove).toHaveBeenCalledWith(
        emailVerificationToken,
      );
    });
  });
});
