import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { UserEntity } from '@app/common/database/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  CreateUserPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
  UpdateUserRolePayload,
  User,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { RpcException } from '@nestjs/microservices';
import { UserRole } from '@app/common/database/enums';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

describe('UserService', () => {
  let userService: jest.Mocked<UserService>;
  let userRepository: jest.Mocked<Repository<UserEntity>>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
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
      ],
    }).compile();

    userService = app.get<jest.Mocked<UserService>>(UserService);
    userRepository = app.get<jest.Mocked<Repository<UserEntity>>>(
      getRepositoryToken(UserEntity),
    );
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

    beforeEach(async () => {
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

    it('should return created user without password', () => {
      expect(result).toEqual({
        id: user.id,
        username: user.username,
        email: user.email,
      });
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
      result = await userService.updateUserRole(payload);

      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        role: payload.role,
      });
    });

    it('should return updated user', async () => {
      userRepository.findOne.mockResolvedValueOnce(user);
      result = await userService.updateUserRole(payload);

      expect(result).toEqual({
        ...user,
        role: payload.role,
      });
    });
  });
});
