import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { of } from 'rxjs';
import { UserEntity, UserOAuthEntity } from '@app/common/database/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ActivateUserEmailPayload,
  CreateUserOAuthPayload,
  CreateUserPayload,
  GetUserByEmailPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
  GetUserByOAuthPayload,
  LinkUserWithOAuthPayload,
  SendEmailActivationPayload,
  UpdateUserRolePayload,
  User,
  UserWithOAuth,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { UserRole } from '@app/common/database/enums';
import { NOTIFICATION_SERVICE } from '@app/common/constants';
import { UserCommands } from '@app/common/messaging';
import { EmailVerificationService } from './email-verification.service';

jest.mock('./email-verification.service');
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UserService', () => {
  let userService: UserService;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let oauthRepository: jest.Mocked<Repository<UserOAuthEntity>>;
  let notificationServiceClient: jest.Mocked<ClientProxy>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        EmailVerificationService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserOAuthEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
        {
          provide: NOTIFICATION_SERVICE,
          useValue: {
            emit: jest.fn().mockReturnValue(of({})),
            subscribe: jest.fn().mockReturnValue(of({})),
          },
        },
      ],
    }).compile();

    userService = app.get<UserService>(UserService);
    emailVerificationService = app.get<jest.Mocked<EmailVerificationService>>(
      EmailVerificationService,
    );
    userRepository = app.get<jest.Mocked<Repository<UserEntity>>>(
      getRepositoryToken(UserEntity),
    );
    oauthRepository = app.get<jest.Mocked<Repository<UserOAuthEntity>>>(
      getRepositoryToken(UserOAuthEntity),
    );
    notificationServiceClient =
      app.get<jest.Mocked<ClientProxy>>(NOTIFICATION_SERVICE);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(userService).toBeDefined();
    });
  });

  describe('createUser', () => {
    let result: UserWithoutPassword;
    const payload: CreateUserPayload = {
      username: 'username',
      email: 'email',
      password: 'password',
    };
    const user = {
      id: 1,
      username: payload.username,
      email: payload.email,
      password: 'hashedPassword',
    } as UserEntity;
    let sendEmailActivationLinkSpy: jest.SpyInstance;

    beforeEach(async () => {
      sendEmailActivationLinkSpy = jest
        .spyOn(userService, 'sendEmailActivationLink')
        .mockResolvedValue();
      userRepository.create.mockReturnValue(user);
      userRepository.save.mockResolvedValue(user);
      result = await userService.createUser(payload);
    });

    it('should throw RpcException when user with the same name already exists', async () => {
      const existingUser = {
        id: 1,
        username: payload.username,
      } as UserEntity;
      userRepository.findOne.mockResolvedValueOnce(existingUser);
      await expect(userService.createUser(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should throw RpcException when user with the same email already exists', async () => {
      const existingUser = {
        id: 1,
        email: payload.email,
      } as UserEntity;
      userRepository.findOne.mockResolvedValueOnce(existingUser);
      await expect(userService.createUser(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should save created user in the database', () => {
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
      });
    });

    it('should send email activation link', () => {
      expect(sendEmailActivationLinkSpy).toHaveBeenCalledWith({
        email: user.email,
      });
    });

    it('should return created user without password', () => {
      expect(result).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    });
  });

  describe('sendEmailActivationLink', () => {
    const payload: SendEmailActivationPayload = { email: 'email' };
    const user = {
      id: 1,
      username: 'username',
      email: payload.email,
      isEmailVerified: false,
    } as UserWithoutPassword;
    const emailVerificationToken = 'email-verification-token';
    let getUserByEmailSpy: jest.SpyInstance;

    beforeEach(async () => {
      getUserByEmailSpy = jest
        .spyOn(userService, 'getUserByEmail')
        .mockResolvedValue(user);
      emailVerificationService.createToken.mockResolvedValue(
        emailVerificationToken,
      );
      await userService.sendEmailActivationLink(payload);
    });

    it('should get user', () => {
      expect(getUserByEmailSpy).toHaveBeenCalledWith(payload);
    });

    it('should throw RpcException if user email already verified', async () => {
      getUserByEmailSpy.mockResolvedValueOnce({
        ...user,
        isEmailVerified: true,
      });
      await expect(
        userService.sendEmailActivationLink(payload),
      ).rejects.toThrow(RpcException);
    });

    it('should get email verification token', () => {
      expect(emailVerificationService.createToken).toHaveBeenCalledWith(
        user.id,
      );
    });

    it('should send email activation link', () => {
      expect(notificationServiceClient.emit).toHaveBeenCalledWith(
        UserCommands.SendEmailActivationLink,
        {
          userId: user.id,
          username: user.username,
          token: emailVerificationToken,
        },
      );
    });
  });

  describe('activateUserEmail', () => {
    const payload: ActivateUserEmailPayload = {
      token: 'email-verification-token',
    };

    it('should call emailVerificationService', async () => {
      await userService.activateUserEmail(payload);
      expect(emailVerificationService.activateEmail).toHaveBeenCalledWith(
        payload.token,
      );
    });
  });

  describe('getUserById', () => {
    let result: UserWithoutPassword;
    const payload: GetUserByIdPayload = { id: 1 };
    const user = {
      id: payload.id,
      username: 'username',
      email: 'email',
    } as UserEntity;

    it('should throw RpcException when user not found', async () => {
      userRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(userService.getUserById(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should return user without password', async () => {
      userRepository.findOneBy.mockResolvedValueOnce(user);
      result = await userService.getUserById(payload);

      expect(result).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
      });
    });
  });

  describe('getUserByName', () => {
    let result: User;
    const payload: GetUserByNamePayload = { username: 'username' };
    const user = {
      id: 1,
      username: payload.username,
      email: 'email',
      password: 'hashedPassword',
    } as UserEntity;

    it('should throw RpcException when user not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      await expect(userService.getUserByName(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should return user', async () => {
      userRepository.findOne.mockResolvedValueOnce(user);
      result = await userService.getUserByName(payload);

      expect(result).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
      });
    });
  });

  describe('updateUserRole', () => {
    let result: UserWithoutPassword;
    const payload: UpdateUserRolePayload = {
      userId: 222,
      role: UserRole.MANAGER,
    };
    const user = {
      id: 1,
      username: 'uss',
      email: 'email',
      role: UserRole.CUSTOMER,
    } as UserEntity;

    it('should throw RpcException when user not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      await expect(userService.updateUserRole(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should return user if he already has this status', async () => {
      userRepository.findOne.mockResolvedValueOnce({
        ...user,
        role: payload.role,
      });
      result = await userService.updateUserRole(payload);

      expect(result).toEqual({
        ...user,
        role: payload.role,
      });
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should save user with updated role', async () => {
      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.save.mockResolvedValue({ ...user, password: 'hashed' });
      result = await userService.updateUserRole(payload);

      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        role: payload.role,
      });
    });

    it('should return updated user', async () => {
      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.save.mockResolvedValue({ ...user, password: 'hashed' });
      result = await userService.updateUserRole(payload);

      expect(result).toEqual({
        ...user,
        role: payload.role,
      });
    });
  });

  describe('getUserByOAuth', () => {
    let result: UserWithOAuth;
    const payload: GetUserByOAuthPayload = {
      provider: 'provider',
      providerId: 'providerId',
    };
    const user = {
      id: 109,
      username: 'test_user',
      email: 'email',
      oauthAccounts: [],
    } as UserWithOAuth;

    it('should return user', async () => {
      userRepository.findOne.mockResolvedValue(user as UserEntity);
      result = await userService.getUserByOAuth(payload);
      expect(result).toEqual(user);
    });

    it('should throw RpcException when user not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      await expect(userService.getUserByOAuth(payload)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('getUserByEmail', () => {
    let result: UserWithoutPassword;
    const payload: GetUserByEmailPayload = {
      email: 'test@email.com',
    };
    const user = {
      id: 109,
      username: 'test_user',
      email: 'email',
      oauthAccounts: [],
    } as UserWithOAuth;

    it('should return user', async () => {
      userRepository.findOneBy.mockResolvedValue(user as UserEntity);
      result = await userService.getUserByEmail(payload);
      expect(result).toEqual(user);
    });

    it('should throw RpcException when user not found', async () => {
      userRepository.findOneBy.mockResolvedValueOnce(null);
      await expect(userService.getUserByEmail(payload)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('linkUserWithOAuth', () => {
    let result: UserWithoutPassword;
    const payload: LinkUserWithOAuthPayload = {
      userId: 109,
      provider: 'provider',
      providerId: '123j213123',
    };
    const user = {
      id: 109,
      username: 'test_user',
      email: 'email',
      oauthAccounts: [],
    } as UserEntity;
    const oauthAccount: UserOAuthEntity = {
      id: 1,
      provider: payload.provider,
      providerId: payload.providerId,
      user: { id: payload.userId } as UserEntity,
    };

    beforeEach(async () => {
      userRepository.save.mockResolvedValue(user);
      oauthRepository.create.mockReturnValue(oauthAccount);
    });

    it('should throw RpcException when user not found', async () => {
      userRepository.findOne.mockResolvedValueOnce(null);
      await expect(userService.linkUserWithOAuth(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should save user with updated oauthAccounts', async () => {
      userRepository.findOne.mockResolvedValueOnce(user);
      result = await userService.linkUserWithOAuth(payload);

      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        oauthAccounts: [oauthAccount],
      });
    });

    it('should return updated user', async () => {
      const { oauthAccounts, ...rest } = user;
      userRepository.findOne.mockResolvedValueOnce(user);
      result = await userService.linkUserWithOAuth(payload);

      expect(result).toEqual(rest);
    });
  });

  describe('createUserOAuth', () => {
    let result: UserWithoutPassword;
    const payload: CreateUserOAuthPayload = {
      username: 'username',
      email: 'email@email.com',
      provider: 'provider',
      providerId: '123j213123',
    };
    const user = {
      id: 1,
      username: 'test_user',
      email: 'email',
    } as UserWithoutPassword;
    const savedUser = {
      ...user,
      password: null,
    } as UserEntity;
    const oauth: UserOAuthEntity = {
      id: 1,
      provider: payload.provider,
      providerId: payload.providerId,
      user: { id: savedUser.id } as UserEntity,
    };

    beforeEach(async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.create.mockReturnValue(savedUser);
      userRepository.save.mockResolvedValue(savedUser);
      oauthRepository.create.mockReturnValue(oauth);
      result = await userService.createUserOAuth(payload);
    });

    it('should throw RpcException if user already exists', async () => {
      userRepository.findOneBy.mockResolvedValue(user as UserEntity);
      await expect(userService.createUserOAuth(payload)).rejects.toThrow(
        RpcException,
      );
    });

    it('should save user in DB', () => {
      expect(userRepository.save).toHaveBeenCalledWith(savedUser);
    });

    it('should save oauth account in DB', () => {
      expect(oauthRepository.save).toHaveBeenCalledWith(oauth);
    });

    it('should return user', () => {
      expect(result).toEqual(user);
    });
  });
});
