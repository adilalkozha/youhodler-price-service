export interface BinanceTickerResponse {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

export interface BinancePingResponse {
  // Empty response object
}

export interface BinanceErrorResponse {
  code: number;
  msg: string;
}

export interface BinanceApiError {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  data?: BinanceErrorResponse;
}

export type BinanceSymbol = 'BTCUSDT' | 'ETHUSDT' | 'ADAUSDT' | string;

export enum BinanceErrorCodes {
  RATE_LIMIT_EXCEEDED = 429,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

export interface BinanceClientConfig {
  baseUrl: string;
  symbol: BinanceSymbol;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
} 