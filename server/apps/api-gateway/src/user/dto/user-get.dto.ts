import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { GetUserByIdPayload } from '@app/common/contracts/user';

export class GetUserDto implements GetUserByIdPayload {
  @ApiProperty({ example: '1' })
  @IsString()
  id: string;
}
