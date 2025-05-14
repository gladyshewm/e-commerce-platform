import { ApiProperty } from '@nestjs/swagger';

export class SendEmailActivationLinkResponseDto {
  @ApiProperty({ example: 'Activation email link has been successfully sent' })
  message: string;
}
