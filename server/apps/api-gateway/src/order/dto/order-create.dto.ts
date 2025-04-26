import { CreateOrderPayload } from '@app/common/contracts/order';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 15 })
  quantity: number;
}

export class CreateOrderDto implements Omit<CreateOrderPayload, 'userId'> {
  @IsArray()
  @ValidateNested()
  @Type(() => CreateOrderItemDto)
  @ApiProperty({ type: () => [CreateOrderItemDto] })
  items: CreateOrderItemDto[];
}
