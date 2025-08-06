import { Controller, Get, Query, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { PriceService } from './price.service';

@Controller('api/v1/price')
export class PriceController {
  private readonly logger = new Logger(PriceController.name);

  constructor(private readonly priceService: PriceService) {}

  @Get()
  async getCurrentPrice() {
    this.logger.debug('GET /api/v1/price - Fetching current price');

    const latestPrice = await this.priceService.getLatestPrice();
    
    if (!latestPrice) {
      throw new ServiceUnavailableException('No price data available. Please try again later.');
    }

    const responseData = {
      success: true,
      data: {
        symbol: latestPrice.symbol,
        bidPrice: parseFloat(latestPrice.bidPrice.toString()),
        askPrice: parseFloat(latestPrice.askPrice.toString()),
        midPrice: parseFloat(latestPrice.midPrice.toString()),
        timestamp: latestPrice.timestamp,
        commission: parseFloat(latestPrice.commission.toString()),
        spread: parseFloat((latestPrice.askPrice - latestPrice.bidPrice).toFixed(8)),
        spreadPercentage: parseFloat(
          (((latestPrice.askPrice - latestPrice.bidPrice) / latestPrice.midPrice) * 100).toFixed(4)
        ),
      },
      meta: {
        lastUpdated: latestPrice.timestamp,
        recordId: latestPrice.id,
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
  async getPriceHistory(@Query('limit') limitStr?: string) {
    const limit = parseInt(limitStr || '100') || 100;
    
    if (limit < 1 || limit > 1000) {
      throw new BadRequestException('Limit must be between 1 and 1000');
    }

    this.logger.debug(`GET /api/v1/price/history - Fetching price history (limit: ${limit})`);

    const priceHistory = await this.priceService.getPriceHistory(limit);
    
    const responseData = {
      success: true,
      data: priceHistory.map(price => ({
        id: price.id,
        symbol: price.symbol,
        bidPrice: parseFloat(price.bidPrice.toString()),
        askPrice: parseFloat(price.askPrice.toString()),
        midPrice: parseFloat(price.midPrice.toString()),
        commission: parseFloat(price.commission.toString()),
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