import { Controller, Get, Query, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PriceService } from './price.service';
import { MetricsService } from '../metrics/metrics.service';
import { PriceCalculatorService } from './price-calculator.service';
import { CurrentPriceResponseDto, PriceHistoryResponseDto } from './dto/price.dto';

@Controller('api/v1/price')
export class PriceController {
  private readonly logger = new Logger(PriceController.name);

  constructor(
    private readonly priceService: PriceService,
    private readonly metricsService: MetricsService,
    private readonly priceCalculator: PriceCalculatorService,
  ) {}

  @Get()
  async getCurrentPrice(): Promise<CurrentPriceResponseDto> {
    this.logger.debug('GET /api/v1/price - Fetching current price');

    const latestPrice = await this.priceService.getLatestPrice();
    
    if (!latestPrice) {
      throw new ServiceUnavailableException('No price data available. Please try again later.');
    }

    this.metricsService.currentBitcoinPrice.set(latestPrice.midPrice);

    const responseData: CurrentPriceResponseDto = {
      success: true,
      data: {
        symbol: latestPrice.symbol,
        bidPrice: latestPrice.bidPrice,
        askPrice: latestPrice.askPrice,
        midPrice: latestPrice.midPrice,
        timestamp: latestPrice.timestamp,
        commission: latestPrice.commission,
        spread: this.priceCalculator.calculateSpread(latestPrice.bidPrice, latestPrice.askPrice),
        spreadPercentage: this.priceCalculator
          .roundToFourDecimals(
            this.priceCalculator.calculateSpreadPercentage(latestPrice.bidPrice, latestPrice.askPrice)
          ),
      },
      meta: {
        lastUpdated: latestPrice.timestamp,
        recordId: latestPrice.id as number,
      },
    };

    this.logger.log('Successfully returned current price', {
      symbol: latestPrice.symbol,
      midPrice: latestPrice.midPrice,
      recordId: latestPrice.id,
    });

    return responseData;
  }

  @Get('history')
  async getPriceHistory(@Query('limit') limitStr?: string): Promise<PriceHistoryResponseDto> {
    const limit = parseInt(limitStr || '100') || 100;
    
    if (limit < 1 || limit > 1000) {
      throw new BadRequestException('Limit must be between 1 and 1000');
    }

    this.logger.debug(`GET /api/v1/price/history - Fetching price history (limit: ${limit})`);

    const priceHistory = await this.priceService.getPriceHistory(limit);
    
    const responseData: PriceHistoryResponseDto = {
      success: true,
      data: priceHistory.map(price => ({
        id: price.id as number,
        symbol: price.symbol,
        bidPrice: price.bidPrice,
        askPrice: price.askPrice,
        midPrice: price.midPrice,
        commission: price.commission,
        timestamp: price.timestamp,
      })),
      meta: {
        count: priceHistory.length,
        limit,
      },
    };

    this.logger.log(`Successfully returned price history (${priceHistory.length} records)`);

    return responseData;
  }
}