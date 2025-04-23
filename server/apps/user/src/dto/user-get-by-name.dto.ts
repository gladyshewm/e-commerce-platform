import { GetUserByNamePayload } from '@app/common/contracts/user';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserByNameDto implements GetUserByNamePayload {
  @IsString()
  @IsNotEmpty()
  username: string;
}
