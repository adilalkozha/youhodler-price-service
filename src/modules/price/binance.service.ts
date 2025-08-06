import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import {
  BinanceTickerResponse,
  BinancePingResponse,
  BinanceApiError,
  BinanceErrorCodes,
  BinanceClientConfig,
  BinanceSymbol
} from '../../types';
import { MetricsService } from '../metrics/metrics.service';
import { config } from '../../config';

@Injectable()
export class BinanceService {
  private readonly logger = new Logger(BinanceService.name);
  private readonly client: AxiosInstance;
  private readonly binanceConfig: BinanceClientConfig;

  constructor(private readonly metricsService: MetricsService) {
    this.binanceConfig = {
      baseUrl: config.binance.baseUrl,
      symbol: config.binance.symbol,
      timeout: 10000,
      retries: 3,
      retryDelay: 1000
    };

    this.client = axios.create({
      baseURL: this.binanceConfig.baseUrl,
      timeout: this.binanceConfig.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'youhodler-price-service/1.0.0'
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).metadata = { startTime };
        this.logger.debug(`Making request to: ${config.url}`, {
          method: config.method?.toUpperCase(),
          params: config.params
        });
        return config;
      },
      (error: AxiosError) => {
        this.logger.error('Request interceptor error:', this.formatAxiosError(error));
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - ((response.config as any).metadata?.startTime || 0);
        this.logger.debug(`Response received from: ${response.config.url}`, {
          status: response.status,
          duration: `${duration}ms`
        });
        return response;
      },
      (error: AxiosError) => {
        const apiError = this.formatAxiosError(error);
        this.logger.error('Response interceptor error:', apiError);
        return Promise.reject(new Error(apiError.message));
      }
    );
  }

  async getBookTicker(symbol?: BinanceSymbol): Promise<BinanceTickerResponse> {
    const targetSymbol = symbol || this.binanceConfig.symbol;
    const startTime = Date.now();
    
    try {
      this.validateSymbol(targetSymbol);
      
      const response = await this.client.get<BinanceTickerResponse>('/api/v3/ticker/bookTicker', {
        params: { symbol: targetSymbol },
      });

      this.validateTickerResponse(response.data);

      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.updateBinanceMetrics(true, duration);

      this.logger.log(`Successfully fetched price for ${targetSymbol}`, {
        bidPrice: response.data.bidPrice,
        askPrice: response.data.askPrice,
      });

      return response.data;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      this.metricsService.updateBinanceMetrics(false, duration);
      const errorMessage = this.handleBinanceError(error, 'getBookTicker', targetSymbol);
      throw new Error(errorMessage);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get<BinancePingResponse>('/api/v3/ping');
      this.logger.log('Binance API connection test successful', {
        status: response.status,
        baseUrl: this.binanceConfig.baseUrl
      });
      return true;
    } catch (error) {
      const apiError = this.formatAxiosError(error as AxiosError);
      this.logger.error('Binance API connection test failed:', apiError);
      return false;
    }
  }

  private validateSymbol(symbol: string): void {
    if (!symbol || typeof symbol !== 'string') {
      throw new Error('Invalid symbol: symbol must be a non-empty string');
    }
    if (symbol.length < 3 || symbol.length > 20) {
      throw new Error(`Invalid symbol length: ${symbol}`);
    }
  }

  private validateTickerResponse(data: BinanceTickerResponse): void {
    if (!data.symbol || !data.bidPrice || !data.askPrice) {
      throw new Error('Invalid ticker response: missing required fields');
    }
    
    const bidPrice = parseFloat(data.bidPrice);
    const askPrice = parseFloat(data.askPrice);
    
    if (isNaN(bidPrice) || isNaN(askPrice) || bidPrice <= 0 || askPrice <= 0) {
      throw new Error('Invalid ticker response: invalid price values');
    }
    
    if (bidPrice >= askPrice) {
      throw new Error('Invalid ticker response: bid price must be less than ask price');
    }
  }

  private formatAxiosError(error: AxiosError): BinanceApiError {
    return {
      message: error.message,
      status: error.response?.status || 500,
      statusText: error.response?.statusText || 'Unknown Error',
      code: error.code || 'UNKNOWN_ERROR',
      data: error.response?.data as any
    };
  }

  private handleBinanceError(error: unknown, operation: string, symbol?: string): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      
      switch (status) {
        case BinanceErrorCodes.RATE_LIMIT_EXCEEDED:
          return 'Rate limit exceeded. Please try again later.';
        case BinanceErrorCodes.BAD_REQUEST:
          return symbol ? `Invalid symbol: ${symbol}` : 'Bad request to Binance API';
        case BinanceErrorCodes.UNAUTHORIZED:
          return 'Unauthorized access to Binance API';
        case BinanceErrorCodes.FORBIDDEN:
          return 'Access forbidden to Binance API';
        case BinanceErrorCodes.NOT_FOUND:
          return 'Binance API endpoint not found';
        case BinanceErrorCodes.INTERNAL_SERVER_ERROR:
          return 'Binance API internal server error';
        case BinanceErrorCodes.SERVICE_UNAVAILABLE:
          return 'Binance API service unavailable';
        default:
          if (axiosError.code === 'ECONNABORTED') {
            return 'Request timeout. Binance API might be slow.';
          }
          if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
            return 'Unable to connect to Binance API. Check your internet connection.';
          }
      }
    }

    this.logger.error(`Unexpected error in ${operation}:`, error);
    return `Failed to ${operation.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
  }

  getConfig(): Readonly<BinanceClientConfig> {
    return { ...this.binanceConfig };
  }

  updateSymbol(symbol: BinanceSymbol): void {
    this.validateSymbol(symbol);
    this.binanceConfig.symbol = symbol;
    this.logger.log(`Updated symbol to: ${symbol}`);
  }
}