import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BinanceTickerResponse, ProcessedPrice } from '../../types';

@Injectable()
export class PriceCalculatorService {
  private readonly logger = new Logger(PriceCalculatorService.name);
  private commission: number;

  constructor(private readonly configService: ConfigService) {
    this.commission = this.configService.get<number>('SERVICE_COMMISSION', 0.0001);
    
    if (this.commission < 0 || this.commission > 1) {
      throw new Error('Commission must be between 0 and 1');
    }
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

    this.logger.debug('Price calculation completed', {
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

  roundToFourDecimals(value: number): number {
    return this.roundToDecimals(value, 4);
  }

  getCommission(): number {
    return this.commission;
  }

  updateCommission(newCommission: number): void {
    if (newCommission < 0 || newCommission > 1) {
      throw new Error('Commission must be between 0 and 1');
    }
    
    this.logger.log(`Commission updated from ${this.commission} to ${newCommission}`);
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