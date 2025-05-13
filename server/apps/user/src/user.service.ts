import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  CreateUserOAuthPayload,
  CreateUserPayload,
  GetUserByEmailPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
  GetUserByOAuthPayload,
  LinkUserWithOAuthPayload,
  UpdateUserRolePayload,
  User,
  UserWithOAuth,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { UserEntity, UserOAuthEntity } from '@app/common/database/entities';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserOAuthEntity)
    private readonly oauthRepository: Repository<UserOAuthEntity>,
  ) {}

  async createUser(payload: CreateUserPayload): Promise<UserWithoutPassword> {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: payload.username }, { email: payload.email }],
    });

    if (existingUser) {
      const existingField =
        existingUser.username === payload.username ? 'username' : 'email';

      this.logger.error(`User with this ${existingField} already exists`);
      throw new RpcException({
        message: `User with this ${existingField} already exists`,
        statusCode: HttpStatus.CONFLICT,
      });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = this.userRepository.create({
      username: payload.username,
      email: payload.email,
      password: hashedPassword,
    });
    const { password, ...saved } = await this.userRepository.save(user);

    this.logger.log(
      `User with username ${saved.username} has been successfully created`,
    );

    return saved;
  }

  async getUserById(payload: GetUserByIdPayload): Promise<UserWithoutPassword> {
    const { id } = payload;
    const user = await this.userRepository.findOneBy({
      id,
    });

    if (!user) {
      this.logger.error(`User with id ${id} not found`);
      throw new RpcException({
        message: `User with id ${id} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return user;
  }

  async getUserByName(payload: GetUserByNamePayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { username: payload.username },
      select: [
        'id',
        'username',
        'email',
        'password',
        'role',
        'isEmailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      this.logger.error(`User with username ${payload.username} not found`);
      throw new RpcException({
        message: `User with username ${payload.username} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return user;
  }

  async getUserByOAuth(payload: GetUserByOAuthPayload): Promise<UserWithOAuth> {
    const { provider, providerId } = payload;
    const user = await this.userRepository.findOne({
      where: {
        oauthAccounts: {
          provider,
          providerId,
        },
      },
      relations: ['oauthAccounts'],
    });

    if (!user) {
      this.logger.error(
        `User with OAuth account ${provider}:${providerId} not found`,
      );
      throw new RpcException({
        message: `User with OAuth account ${provider}:${providerId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return user;
  }

  async getUserByEmail(
    payload: GetUserByEmailPayload,
  ): Promise<UserWithoutPassword> {
    const { email } = payload;
    const user = await this.userRepository.findOneBy({
      email,
    });

    if (!user) {
      this.logger.error(`User with email ${email} not found`);
      throw new RpcException({
        message: `User with email ${email} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    return user;
  }

  async updateUserRole(
    payload: UpdateUserRolePayload,
  ): Promise<UserWithoutPassword> {
    const { userId, role } = payload;
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(`User with ID ${userId} not found`);
      throw new RpcException({
        message: `User with ID ${userId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const existingRole = user.role;

    if (existingRole === role) {
      this.logger.warn(
        `User with ID ${userId} already has the role ${existingRole.toUpperCase()}`,
      );
      return user;
    }

    user.role = role;
    const saved = await this.userRepository.save(user);

    this.logger.log(
      `Role of the user with ID ${userId} has been successfully changed from ${existingRole.toUpperCase()} to ${role.toUpperCase()}`,
    );

    const { password, ...rest } = saved;
    return rest;
  }

  async linkUserWithOAuth(
    payload: LinkUserWithOAuthPayload,
  ): Promise<UserWithoutPassword> {
    const { userId, provider, providerId } = payload;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['oauthAccounts'],
    });

    if (!user) {
      this.logger.error(`User with ID ${userId} not found`);
      throw new RpcException({
        message: `User with ID ${userId} not found`,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const oauth = this.oauthRepository.create({
      provider,
      providerId,
      user,
    });
    user.oauthAccounts.push(oauth);
    const saved = await this.userRepository.save(user);

    this.logger.log(
      `OAuth account ${provider}:${providerId} has been successfully linked to the user with ID ${userId}`,
    );
    const { oauthAccounts, ...rest } = saved;
    return rest;
  }

  async createUserOAuth(
    payload: CreateUserOAuthPayload,
  ): Promise<UserWithoutPassword> {
    const { username, email, provider, providerId } = payload;

    const existingUser = await this.userRepository.findOneBy({
      username,
    });

    if (existingUser) {
      this.logger.error(`User with username ${username} already exists`);
      throw new RpcException({
        message: `User with username ${username} already exists`,
        statusCode: HttpStatus.CONFLICT,
      });
    }

    const user = this.userRepository.create({
      username,
      email,
      password: null,
      isEmailVerified: true,
    });
    const savedUser = await this.userRepository.save(user);

    this.logger.log(
      `User with username ${username} has been successfully created`,
    );

    const oauth = this.oauthRepository.create({
      provider,
      providerId,
      user: savedUser,
    });
    await this.oauthRepository.save(oauth);

    this.logger.log(
      `OAuth account ${provider}:${providerId} has been successfully linked to the user with ID ${savedUser.id}`,
    );

    const { password, ...rest } = savedUser;
    return rest;
  }
}
