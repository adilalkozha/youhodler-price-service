import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Price, PriceRecord } from '../../models/Price';
import { BinanceService } from './binance.service';
import { PriceCalculatorService } from './price-calculator.service';
import { MetricsService } from '../metrics/metrics.service';
import { ProcessedPrice } from '../../types';
import { config } from '../../config';

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly symbol = config.binance.symbol;

  constructor(
    @InjectModel(Price)
    private readonly priceModel: typeof Price,
    private readonly binanceService: BinanceService,
    private readonly priceCalculatorService: PriceCalculatorService,
    private readonly metricsService: MetricsService,
  ) {}

  async fetchAndStorePriceData(): Promise<PriceRecord> {
    try {
      this.logger.debug(`Fetching price data for ${this.symbol}`);
      
      const ticker = await this.binanceService.getBookTicker();
      const processedPrice = this.priceCalculatorService.calculatePrice(ticker);
      
      const priceRecord = await this.storePriceData(ticker, processedPrice);
      
      this.metricsService.updatePriceMetrics(true, priceRecord.midPrice);
      
      this.logger.log(`Successfully stored price data for ${this.symbol}`, {
        id: priceRecord.id,
        midPrice: priceRecord.midPrice,
      });
      
      return priceRecord;
    } catch (error) {
      this.metricsService.updatePriceMetrics(false);
      this.logger.error('Failed to fetch and store price data:', error);
      throw error;
    }
  }

  private async storePriceData(
    ticker: any,
    processedPrice: ProcessedPrice
  ): Promise<PriceRecord> {
    const priceRecord: Omit<PriceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      symbol: this.symbol,
      bidPrice: processedPrice.bidPrice,
      askPrice: processedPrice.askPrice,
      midPrice: processedPrice.midPrice,
      originalBidPrice: parseFloat(ticker.bidPrice),
      originalAskPrice: parseFloat(ticker.askPrice),
      commission: this.priceCalculatorService.getCommission(),
      timestamp: processedPrice.timestamp,
    };

    const savedRecord = await this.priceModel.create(priceRecord);
    return savedRecord.toJSON() as PriceRecord;
  }

  async getLatestPrice(): Promise<PriceRecord | null> {
    try {
      const latestPrice = await this.priceModel.findOne({
        where: { symbol: this.symbol },
        order: [['timestamp', 'DESC']],
      });

      if (!latestPrice) {
        this.logger.warn(`No price data found for ${this.symbol}`);
        return null;
      }

      return latestPrice.toJSON() as PriceRecord;
    } catch (error) {
      this.logger.error('Failed to get latest price:', error);
      throw error;
    }
  }

  async getPriceHistory(limit: number = 100): Promise<PriceRecord[]> {
    try {
      const prices = await this.priceModel.findAll({
        where: { symbol: this.symbol },
        order: [['timestamp', 'DESC']],
        limit,
      });

      return prices.map(price => price.toJSON() as PriceRecord);
    } catch (error) {
      this.logger.error('Failed to get price history:', error);
      throw error;
    }
  }

  async cleanupOldPrices(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await this.priceModel.destroy({
        where: {
          symbol: this.symbol,
          timestamp: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleaned up ${deletedCount} old price records older than ${olderThanDays} days`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup old prices:', error);
      throw error;
    }
  }
}