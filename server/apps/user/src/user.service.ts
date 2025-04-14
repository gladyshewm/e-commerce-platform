import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  CreateUserPayload,
  GetUserByIdPayload,
  GetUserByNamePayload,
  User,
  UserWithoutPassword,
} from '@app/common/contracts/user';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { UserEntity } from '@app/common/entities';

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

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }

  async getUserByName(payload: GetUserByNamePayload): Promise<User> {
    const user = await this.userRepository.findOneBy({
      username: payload.username,
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
}
