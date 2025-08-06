import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectModel } from '@nestjs/sequelize';
import { Price } from '../../models/Price';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectModel(Price)
    private readonly priceModel: typeof Price,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.priceModel.sequelize?.authenticate();
      
      const result = this.getStatus(key, true, {
        connection: 'active',
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      throw new HealthCheckError(
        'Database connection failed',
        this.getStatus(key, false, {
          connection: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }
}