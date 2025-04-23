import { CreateCategoryPayload } from '@app/common/contracts/product';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto implements CreateCategoryPayload {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
