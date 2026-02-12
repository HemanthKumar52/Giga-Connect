import { IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FundEscrowDto {
  @ApiProperty()
  @IsString()
  contractId: string;

  @ApiProperty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentToken?: string;
}

export class SetupPayoutDto {
  @ApiProperty({ example: 'bank_transfer' })
  @IsString()
  payoutMethod: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  bankAccountInfo?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountHolderName?: string;
    country?: string;
    currency?: string;
  };
}

export class RequestPayoutDto {
  @ApiProperty()
  @IsNumber()
  @Min(10)
  amount: number;
}
