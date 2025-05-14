import { ApiProperty } from '@nestjs/swagger';

export class ActivateUserEmailResponseDto {
  @ApiProperty({ example: 'Email has been successfully activated' })
  message: string;
}
