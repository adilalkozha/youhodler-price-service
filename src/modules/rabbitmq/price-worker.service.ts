import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PriceService } from '../price/price.service';
import { RabbitmqService, PriceUpdateMessage } from './rabbitmq.service';
import { config } from '../../config';

@Injectable()
export class PriceWorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PriceWorkerService.name);
  private workerInterval?: NodeJS.Timeout;
  private isRunning = false;
  private consecutiveErrors = 0;
  private readonly maxRetries = 3;

  constructor(
    private readonly priceService: PriceService,
    private readonly rabbitmqService: RabbitmqService,
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

    this.workerInterval = setInterval(async () => {
      try {
        await this.fetchAndStorePrice();
      } catch (error) {
        this.logger.error('Worker error:', error);
        this.consecutiveErrors++;
        
        if (this.consecutiveErrors >= this.maxRetries) {
          this.logger.error(`Worker stopped after ${this.maxRetries} consecutive errors`);
          this.stopWorker();
        }
      }
    }, config.updateInterval);

    this.rabbitmqService.emitPriceFetchEvent(config.binance.symbol).subscribe({
      next: () => this.logger.debug('Initial price fetch event emitted'),
      error: (error) => this.logger.error('Failed to emit initial fetch event:', error)
    });
  }

  private stopWorker(): void {
    if (!this.isRunning) {
      this.logger.warn('Worker is not running');
      return;
    }

    this.logger.log('Stopping background worker');
    this.isRunning = false;

    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = undefined;
    }
  }

  private async fetchAndStorePrice(): Promise<void> {
    try {
      const priceRecord = await this.priceService.fetchAndStorePriceData();
      this.consecutiveErrors = 0;

      this.rabbitmqService.sendPriceUpdateMessage({
        symbol: priceRecord.symbol,
        timestamp: priceRecord.timestamp,
        action: 'fetch'
      }).subscribe({
        next: () => this.logger.debug('Price update message sent'),
        error: (error) => this.logger.error('Failed to send price update message:', error)
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