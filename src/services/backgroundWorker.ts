import { PriceService } from './priceService';
import { logger } from '../config/logger';

export class BackgroundWorker {
  private priceService: PriceService;
  private intervalId: NodeJS.Timeout | null = null;
  private updateInterval: number;
  private isRunning: boolean = false;
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 5;
  private backoffMultiplier: number = 1.5;
  private maxBackoffInterval: number = 300000; // 5 minutes

  constructor(priceService: PriceService, updateInterval: number) {
    this.priceService = priceService;
    this.updateInterval = updateInterval;
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('Background worker is already running');
      return;
    }

    this.isRunning = true;
    this.consecutiveErrors = 0;
    logger.info(`Starting background worker with ${this.updateInterval}ms interval`);

    this.scheduleNextUpdate(0);
  }

  stop(): void {
    if (!this.isRunning) {
      logger.warn('Background worker is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Background worker stopped');
  }

  private scheduleNextUpdate(delay: number = this.updateInterval): void {
    if (!this.isRunning) {
      return;
    }

    this.intervalId = setTimeout(async () => {
      await this.updatePrice();
      
      if (this.isRunning) {
        const nextDelay = this.calculateNextDelay();
        this.scheduleNextUpdate(nextDelay);
      }
    }, delay);
  }

  private async updatePrice(): Promise<void> {
    try {
      logger.debug('Background worker: Updating price data');
      
      const startTime = Date.now();
      await this.priceService.fetchAndStorePriceData();
      const duration = Date.now() - startTime;
      
      this.consecutiveErrors = 0;
      
      logger.debug(`Price update completed in ${duration}ms`);
    } catch (error) {
      this.consecutiveErrors++;
      
      logger.error(`Background worker error (attempt ${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error);
      
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        logger.error('Maximum consecutive errors reached. Stopping background worker.');
        this.stop();
        throw new Error('Background worker stopped due to consecutive errors');
      }
    }
  }

  private calculateNextDelay(): number {
    if (this.consecutiveErrors === 0) {
      return this.updateInterval;
    }

    const backoffDelay = this.updateInterval * Math.pow(this.backoffMultiplier, this.consecutiveErrors - 1);
    const delay = Math.min(backoffDelay, this.maxBackoffInterval);
    
    logger.warn(`Using backoff delay of ${delay}ms due to ${this.consecutiveErrors} consecutive errors`);
    
    return delay;
  }

  getStatus(): {
    isRunning: boolean;
    consecutiveErrors: number;
    updateInterval: number;
  } {
    return {
      isRunning: this.isRunning,
      consecutiveErrors: this.consecutiveErrors,
      updateInterval: this.updateInterval,
    };
  }

  updateInterval(newInterval: number): void {
    if (newInterval < 1000) {
      throw new Error('Update interval must be at least 1000ms');
    }

    const oldInterval = this.updateInterval;
    this.updateInterval = newInterval;
    
    logger.info(`Update interval changed from ${oldInterval}ms to ${newInterval}ms`);
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}