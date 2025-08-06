export interface ConfigType {
  port: number;
  updateInterval: number;
  commission: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  binance: {
    baseUrl: string;
    symbol: string;
  };
  rabbitmq: {
    url: string;
  };
}

export interface ProcessedPrice {
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  timestamp: Date;
}

export interface BinanceTickerResponse {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

export interface BinancePingResponse {
  // Empty object response from Binance ping endpoint
}

export interface BinanceApiError {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  data?: any;
}

export interface BinanceClientConfig {
  baseUrl: string;
  symbol: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

export type BinanceSymbol = string;

export enum BinanceErrorCodes {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  RATE_LIMIT_EXCEEDED = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}