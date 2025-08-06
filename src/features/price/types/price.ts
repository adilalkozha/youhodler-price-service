export interface ProcessedPrice {
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  timestamp: Date;
}

export interface PriceRecord {
  id?: number;
  symbol: string;
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  originalBidPrice: number;
  originalAskPrice: number;
  commission: number;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 