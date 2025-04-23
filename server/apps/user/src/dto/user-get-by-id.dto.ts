import { GetUserByIdPayload } from '@app/common/contracts/user';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetUserByIdDto implements GetUserByIdPayload {
  @IsNumber()
  @IsNotEmpty()
  id: number;
}
