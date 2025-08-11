import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { PriceService } from '../price/price.service';
import { MetricsService } from '../metrics/metrics.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PriceWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PriceWorkerService.name);
  private workerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private consecutiveErrors = 0;
  private readonly maxRetries = 3;

  constructor(
    private readonly priceService: PriceService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    this.startWorker();
  }

  async onApplicationShutdown() {
    this.stopWorker();
  }

  private startWorker(): void {
    if (this.isRunning) {
      this.logger.warn('Worker is already running');
      return;
    }

    const updateInterval = this.configService.get<number>('UPDATE_INTERVAL', 10000);
    this.logger.log(`Starting background worker with interval: ${updateInterval}ms`);
    this.isRunning = true;
    this.consecutiveErrors = 0;
    this.metricsService.updateWorkerMetrics(true, 0);

    this.workerInterval = setInterval(async () => {
      try {
        await this.fetchAndStorePrice();
      } catch (error) {
        this.logger.error('Worker error:', error);
        this.consecutiveErrors++;
        this.metricsService.updateWorkerMetrics(true, this.consecutiveErrors);
        
        if (this.consecutiveErrors >= this.maxRetries) {
          this.logger.error(`Worker stopped after ${this.maxRetries} consecutive errors`);
          this.stopWorker();
        }
      }
    }, updateInterval);

    this.logger.debug('Background worker started successfully');
  }

  private stopWorker(): void {
    if (!this.isRunning) {
      this.logger.warn('Worker is not running');
      return;
    }

    this.logger.log('Stopping background worker');
    this.isRunning = false;
    this.metricsService.updateWorkerMetrics(false, this.consecutiveErrors);

    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
  }

  private async fetchAndStorePrice(): Promise<void> {
    try {
      const priceRecord = await this.priceService.fetchAndStorePriceData();
      this.consecutiveErrors = 0;
      this.metricsService.updateWorkerMetrics(true, 0);
      this.logger.debug('Price data fetched and stored successfully', {
        symbol: priceRecord.symbol,
        timestamp: priceRecord.timestamp
      });

    } catch (error) {
      this.logger.error('Failed to fetch and store price data:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      consecutiveErrors: this.consecutiveErrors,
      maxRetries: this.maxRetries,
      updateInterval: this.configService.get<number>('UPDATE_INTERVAL', 10000),
    };
  }

  restart(): void {
    this.stopWorker();
    setTimeout(() => this.startWorker(), 1000);
  }
}