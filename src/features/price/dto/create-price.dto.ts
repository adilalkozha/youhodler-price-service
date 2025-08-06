import { IsString, IsNumber, IsDateString, IsPositive, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceDto {
  @IsString({ message: 'Symbol must be a string' })
  @IsNotEmpty({ message: 'Symbol is required' })
  symbol!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Bid price must be a number' })
  @IsPositive({ message: 'Bid price must be positive' })
  bidPrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Ask price must be a number' })
  @IsPositive({ message: 'Ask price must be positive' })
  askPrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Mid price must be a number' })
  @IsPositive({ message: 'Mid price must be positive' })
  midPrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Original bid price must be a number' })
  @IsPositive({ message: 'Original bid price must be positive' })
  originalBidPrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Original ask price must be a number' })
  @IsPositive({ message: 'Original ask price must be positive' })
  originalAskPrice!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Commission must be a number' })
  @Min(0, { message: 'Commission cannot be negative' })
  @Max(1, { message: 'Commission cannot exceed 1 (100%)' })
  commission!: number;

  @Type(() => Date)
  @IsDateString({}, { message: 'Timestamp must be a valid date' })
  timestamp!: Date;
}