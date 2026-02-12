import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GlobalSearchDto {
  @ApiProperty()
  @IsString()
  query: string;

  @ApiPropertyOptional({ enum: ['freelancers', 'jobs', 'products', 'skills'] })
  @IsOptional()
  @IsEnum(['freelancers', 'jobs', 'products', 'skills'])
  type?: 'freelancers' | 'jobs' | 'products' | 'skills';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
