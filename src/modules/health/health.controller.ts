import { Controller, Get, Logger } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { BinanceHealthIndicator } from './binance-health.indicator';
import { PriceService } from '../price/price.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly databaseHealthIndicator: DatabaseHealthIndicator,
    private readonly binanceHealthIndicator: BinanceHealthIndicator,
    private readonly priceService: PriceService,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    this.logger.debug('Health check requested');

    const result = await this.health.check([
      () => this.databaseHealthIndicator.isHealthy('database'),
      () => this.binanceHealthIndicator.isHealthy('binance'),
      async () => {
        const latestPrice = await this.priceService.getLatestPrice();
        const isHealthy = latestPrice !== null;
        const timeSinceUpdate = latestPrice 
          ? Date.now() - new Date(latestPrice.timestamp).getTime()
          : null;

        if (!isHealthy) {
          throw new Error('No price data available');
        }

        return {
          'price-data': {
            status: 'up',
            hasData: true,
            lastUpdate: latestPrice?.timestamp || null,
            timeSinceLastUpdate: timeSinceUpdate,
          }
        };
      },
    ]);

    this.logger.log('Health check completed', { status: result.status });
    return result;
  }
}