import { Expose, Type } from 'class-transformer';

export class PriceDataDto {
  @Expose()
  id!: number;

  @Expose()
  symbol!: string;

  @Expose()
  @Type(() => Number)
  bidPrice!: number;

  @Expose()
  @Type(() => Number)
  askPrice!: number;

  @Expose()
  @Type(() => Number)
  midPrice!: number;

  @Expose()
  @Type(() => Number)
  commission!: number;

  @Expose()
  @Type(() => Date)
  timestamp!: Date;

  @Expose()
  @Type(() => Number)
  spread?: number;

  @Expose()
  @Type(() => Number)
  spreadPercentage?: number;
}

export class PriceMetaDto {
  @Expose()
  lastUpdated?: Date;

  @Expose()
  recordId?: number;

  @Expose()
  count?: number;

  @Expose()
  limit?: number;

  @Expose()
  offset?: number;
}

export class PriceResponseDto {
  @Expose()
  success!: boolean;

  @Expose()
  @Type(() => PriceDataDto)
  data!: PriceDataDto | PriceDataDto[];

  @Expose()
  @Type(() => PriceMetaDto)
  meta?: PriceMetaDto;

  @Expose()
  message?: string;
}