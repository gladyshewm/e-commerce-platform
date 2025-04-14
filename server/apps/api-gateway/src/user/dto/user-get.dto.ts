import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { GetUserByIdPayload } from '@app/common/contracts/user';
import { Type } from 'class-transformer';

export class GetUserDto implements GetUserByIdPayload {
  @ApiProperty({ example: '1' })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  id: number;
}
