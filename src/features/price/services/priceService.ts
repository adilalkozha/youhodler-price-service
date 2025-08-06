import { Database, Price } from '../../../models';
import { BinanceClient } from './binanceClient';
import { PriceCalculator } from './priceCalculator';
import { PriceRecord, ProcessedPrice } from '../types';
import { logger } from '../../../config/logger';

export class PriceService {
  private database: Database;
  private binanceClient: BinanceClient;
  private priceCalculator: PriceCalculator;
  private symbol: string;

  constructor(
    database: Database,
    binanceClient: BinanceClient,
    priceCalculator: PriceCalculator,
    symbol: string
  ) {
    this.database = database;
    this.binanceClient = binanceClient;
    this.priceCalculator = priceCalculator;
    this.symbol = symbol;
  }

  async fetchAndStorePriceData(): Promise<PriceRecord> {
    try {
      logger.debug(`Fetching price data for ${this.symbol}`);
      
      const ticker = await this.binanceClient.getBookTicker();
      const processedPrice = this.priceCalculator.calculatePrice(ticker);
      
      const priceRecord = await this.storePriceData(ticker, processedPrice);
      
      logger.info(`Successfully stored price data for ${this.symbol}`, {
        id: priceRecord.id,
        midPrice: priceRecord.midPrice,
      });
      
      return priceRecord;
    } catch (error) {
      logger.error('Failed to fetch and store price data:', error);
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
      commission: this.priceCalculator.getCommission(),
      timestamp: processedPrice.timestamp,
    };

    const savedRecord = await this.database.Price.create(priceRecord);
    return savedRecord.toJSON() as PriceRecord;
  }

  async getLatestPrice(): Promise<PriceRecord | null> {
    try {
      const latestPrice = await this.database.Price.findOne({
        where: { symbol: this.symbol },
        order: [['timestamp', 'DESC']],
      });

      if (!latestPrice) {
        logger.warn(`No price data found for ${this.symbol}`);
        return null;
      }

      return latestPrice.toJSON() as PriceRecord;
    } catch (error) {
      logger.error('Failed to get latest price:', error);
      throw error;
    }
  }

  async getPriceHistory(limit: number = 100): Promise<PriceRecord[]> {
    try {
      const prices = await this.database.Price.findAll({
        where: { symbol: this.symbol },
        order: [['timestamp', 'DESC']],
        limit,
      });

      return prices.map(price => price.toJSON() as PriceRecord);
    } catch (error) {
      logger.error('Failed to get price history:', error);
      throw error;
    }
  }

  async cleanupOldPrices(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await this.database.Price.destroy({
        where: {
          symbol: this.symbol,
          timestamp: {
            [require('sequelize').Op.lt]: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${deletedCount} old price records older than ${olderThanDays} days`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old prices:', error);
      throw error;
    }
  }
}