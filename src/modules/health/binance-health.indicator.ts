import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { BinanceService } from '../price/binance.service';

@Injectable()
export class BinanceHealthIndicator extends HealthIndicator {
  constructor(private readonly binanceService: BinanceService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isConnected = await this.binanceService.testConnection();
      
      if (!isConnected) {
        throw new Error('Binance API connection test failed');
      }

      const result = this.getStatus(key, true, {
        connection: 'active',
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      throw new HealthCheckError(
        'Binance API connection failed',
        this.getStatus(key, false, {
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }
}