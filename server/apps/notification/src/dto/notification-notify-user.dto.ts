import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class NotifyUserDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  username: string;
}
