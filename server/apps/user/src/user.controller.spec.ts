import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RmqService } from '@app/rmq';
import { User, UserWithoutPassword } from '@app/common/contracts/user';
import { CreateUserDto } from './dto/user-create.dto';
import { RmqContext, RpcException } from '@nestjs/microservices';
import { GetUserByIdDto } from './dto/user-get-by-id.dto';
import { GetUserByNameDto } from './dto/user-get-by-name.dto';
import { UpdateUserRoleDto } from './dto/user-update-role.dto';
import { UserRole } from '@app/common/database/enums';

jest.mock('./user.service');

describe('UserController', () => {
  let userController: UserController;
  let userService: jest.Mocked<UserService>;
  let rmqService: jest.Mocked<RmqService>;
  const ctx = {} as RmqContext;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: RmqService,
          useValue: {
            ack: jest.fn(),
          },
        },
      ],
    }).compile();

    userController = app.get<UserController>(UserController);
    userService = app.get<jest.Mocked<UserService>>(UserService);
    rmqService = app.get<jest.Mocked<RmqService>>(RmqService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(userController).toBeDefined();
    });
  });

  describe('createUser', () => {
    let result: UserWithoutPassword;
    const payload: CreateUserDto = {
      username: 'username',
      email: 'email',
      password: 'password',
    };
    const user = {
      id: 1,
      username: payload.username,
      email: payload.email,
    } as UserWithoutPassword;

    beforeEach(async () => {
      userService.createUser.mockResolvedValue(user);
      result = await userController.createUser(payload, ctx);
    });

    it('should call userService', () => {
      expect(userService.createUser).toHaveBeenCalledWith(payload);
    });

    it('should return user', () => {
      expect(result).toEqual(user);
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('getUserById', () => {
    let result: UserWithoutPassword;
    const payload: GetUserByIdDto = { id: 1 };
    const user = {
      id: payload.id,
      username: 'test',
      email: 'test',
    } as UserWithoutPassword;

    beforeEach(async () => {
      userService.getUserById.mockResolvedValue(user);
      result = await userController.getUserById(payload, ctx);
    });

    it('should call userService', () => {
      expect(userService.getUserById).toHaveBeenCalledWith(payload);
    });

    it('should return user', () => {
      expect(result).toEqual(user);
    });

    it('should throw RpcException when user not found', async () => {
      userService.getUserById.mockRejectedValueOnce(
        new RpcException('User not found'),
      );
      await expect(userController.getUserById(payload, ctx)).rejects.toThrow(
        RpcException,
      );
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('getUserByName', () => {
    let result: User;
    const payload: GetUserByNameDto = { username: 'username' };
    const user = {
      id: 1,
      username: payload.username,
      email: 'email',
      password: 'hashed',
    } as User;

    beforeEach(async () => {
      userService.getUserByName.mockResolvedValue(user);
      result = await userController.getUserByName(payload, ctx);
    });

    it('should call userService', () => {
      expect(userService.getUserByName).toHaveBeenCalledWith(payload);
    });

    it('should return user', () => {
      expect(result).toEqual(user);
    });

    it('should throw RpcException when user not found', async () => {
      userService.getUserByName.mockRejectedValueOnce(
        new RpcException('User not found'),
      );
      await expect(userController.getUserByName(payload, ctx)).rejects.toThrow(
        RpcException,
      );
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });

  describe('updateUserRole', () => {
    let result: UserWithoutPassword;
    const payload: UpdateUserRoleDto = { userId: 123, role: UserRole.CUSTOMER };
    const user = {
      id: 1,
      username: 'test_user',
      email: 'email',
      role: UserRole.CUSTOMER,
    } as UserWithoutPassword;

    beforeEach(async () => {
      userService.updateUserRole.mockResolvedValue(user);
      result = await userController.updateUserRole(payload, ctx);
    });

    it('should call userService', () => {
      expect(userService.updateUserRole).toHaveBeenCalledWith(payload);
    });

    it('should return updated user', () => {
      expect(result).toEqual(user);
    });

    it('should throw RpcException when user not found', async () => {
      userService.updateUserRole.mockRejectedValueOnce(
        new RpcException('User not found'),
      );
      await expect(userController.updateUserRole(payload, ctx)).rejects.toThrow(
        RpcException,
      );
    });

    it('should call ack', () => {
      expect(rmqService.ack).toHaveBeenCalledTimes(1);
      expect(rmqService.ack).toHaveBeenCalledWith(ctx);
    });
  });
});
