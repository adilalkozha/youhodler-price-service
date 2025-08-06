import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PriceService } from '../price/price.service';
import { RabbitmqService, PriceUpdateMessage } from './rabbitmq.service';
import { MetricsService } from '../metrics/metrics.service';
import { config } from '../../config';

@Injectable()
export class PriceWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PriceWorkerService.name);
  private workerInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private consecutiveErrors = 0;
  private readonly maxRetries = 3;

  constructor(
    private readonly priceService: PriceService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly metricsService: MetricsService,
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

    this.logger.log(`Starting background worker with interval: ${config.updateInterval}ms`);
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
    }, config.updateInterval);

    // Initial price fetch will be handled by the setInterval worker
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

      // Price update completed successfully - no need to send self-message
      this.logger.debug('Price data fetched and stored successfully', {
        symbol: priceRecord.symbol,
        timestamp: priceRecord.timestamp
      });

    } catch (error) {
      this.logger.error('Failed to fetch and store price data:', error);
      throw error;
    }
  }

  @MessagePattern('price.update')
  handlePriceUpdate(@Payload() data: PriceUpdateMessage) {
    this.logger.debug('Received price update message', data);
    return { success: true, timestamp: new Date() };
  }

  @EventPattern('price.fetch')
  async handlePriceFetch(@Payload() data: PriceUpdateMessage) {
    this.logger.debug('Received price fetch event', data);
    try {
      await this.fetchAndStorePrice();
    } catch (error) {
      this.logger.error('Failed to handle price fetch event:', error);
    }
  }

  @EventPattern('price.cleanup')
  async handlePriceCleanup(@Payload() data: PriceUpdateMessage) {
    this.logger.debug('Received price cleanup event', data);
    try {
      const deletedCount = await this.priceService.cleanupOldPrices(30);
      this.logger.log(`Cleaned up ${deletedCount} old price records`);
    } catch (error) {
      this.logger.error('Failed to handle price cleanup event:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      consecutiveErrors: this.consecutiveErrors,
      maxRetries: this.maxRetries,
      updateInterval: config.updateInterval,
    };
  }

  restart(): void {
    this.stopWorker();
    setTimeout(() => this.startWorker(), 1000);
  }
}