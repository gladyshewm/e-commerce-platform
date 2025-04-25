import { ChargePaymentPayload } from '@app/common/contracts/payment';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class ChargePaymentDto implements ChargePaymentPayload {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}
