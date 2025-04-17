import { CreateCategoryPayload } from '@app/common/contracts/product';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto implements CreateCategoryPayload {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Category 1' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Description 1' })
  description?: string;
}
