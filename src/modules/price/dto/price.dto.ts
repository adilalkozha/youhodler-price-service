export interface CurrentPriceResponseDto {
  success: true;
  data: {
    symbol: string;
    bidPrice: number;
    askPrice: number;
    midPrice: number;
    timestamp: Date;
    commission: number;
    spread: number;
    spreadPercentage: number;
  };
  meta: {
    lastUpdated: Date;
    recordId?: number;
  };
}

export interface PriceHistoryItemDto {
  id?: number;
  symbol: string;
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  commission: number;
  timestamp: Date;
}

export interface PriceHistoryResponseDto {
  success: true;
  data: PriceHistoryItemDto[];
  meta: {
    count: number;
    limit: number;
  };
}


