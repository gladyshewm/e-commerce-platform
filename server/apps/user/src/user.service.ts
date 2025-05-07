import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateUserPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
  UpdateUserRolePayload,
  User,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { UserEntity } from '@app/common/database/entities';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

    return saved;
  }
}
