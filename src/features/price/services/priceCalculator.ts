import { BinanceTickerResponse, ProcessedPrice } from '../types';
import { logger } from '../../../config/logger';

export class PriceCalculator {
  private commission: number;

  constructor(commission: number) {
    if (commission < 0 || commission > 1) {
      throw new Error('Commission must be between 0 and 1');
    }
    this.commission = commission;
  }

  calculatePrice(ticker: BinanceTickerResponse): ProcessedPrice {
    const originalBidPrice = parseFloat(ticker.bidPrice);
    const originalAskPrice = parseFloat(ticker.askPrice);

    if (isNaN(originalBidPrice) || isNaN(originalAskPrice)) {
      throw new Error('Invalid price data received from Binance');
    }

    if (originalBidPrice <= 0 || originalAskPrice <= 0) {
      throw new Error('Price values must be positive');
    }

    if (originalBidPrice >= originalAskPrice) {
      throw new Error('Bid price cannot be greater than or equal to ask price');
    }

    const bidPrice = this.applyCommissionToBid(originalBidPrice);
    const askPrice = this.applyCommissionToAsk(originalAskPrice);
    const midPrice = this.calculateMidPrice(bidPrice, askPrice);

    const result: ProcessedPrice = {
      bidPrice: this.roundToDecimals(bidPrice, 8),
      askPrice: this.roundToDecimals(askPrice, 8),
      midPrice: this.roundToDecimals(midPrice, 8),
      timestamp: new Date(),
    };

    logger.debug('Price calculation completed', {
      original: { bid: originalBidPrice, ask: originalAskPrice },
      processed: result,
      commission: this.commission,
    });

    return result;
  }

  private applyCommissionToBid(bidPrice: number): number {
    return bidPrice * (1 - this.commission);
  }

  private applyCommissionToAsk(askPrice: number): number {
    return askPrice * (1 + this.commission);
  }

  private calculateMidPrice(bidPrice: number, askPrice: number): number {
    return (bidPrice + askPrice) / 2;
  }

  private roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  getCommission(): number {
    return this.commission;
  }

  updateCommission(newCommission: number): void {
    if (newCommission < 0 || newCommission > 1) {
      throw new Error('Commission must be between 0 and 1');
    }
    
    logger.info(`Commission updated from ${this.commission} to ${newCommission}`);
    this.commission = newCommission;
  }

  calculateSpread(bidPrice: number, askPrice: number): number {
    return askPrice - bidPrice;
  }

  calculateSpreadPercentage(bidPrice: number, askPrice: number): number {
    const midPrice = (bidPrice + askPrice) / 2;
    const spread = askPrice - bidPrice;
    return (spread / midPrice) * 100;
  }
}