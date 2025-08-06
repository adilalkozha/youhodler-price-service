import { Request, Response } from 'express';
import { PriceService } from '../services/priceService';
import { AppError, asyncHandler } from '../../../middleware/errorHandler';
import { logger } from '../../../config/logger';

export class PriceController {
  private priceService: PriceService;

  constructor(priceService: PriceService) {
    this.priceService = priceService;
  }

  getCurrentPrice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /api/v1/price - Fetching current price');

    const latestPrice = await this.priceService.getLatestPrice();
    
    if (!latestPrice) {
      throw new AppError('No price data available. Please try again later.', 503);
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

    logger.info('Successfully returned current price', {
      symbol: latestPrice.symbol,
      midPrice: latestPrice.midPrice,
      recordId: latestPrice.id,
    });

    res.json(responseData);
  });

  getPriceHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 100;
    
    if (limit < 1 || limit > 1000) {
      throw new AppError('Limit must be between 1 and 1000', 400);
    }

    logger.debug(`GET /api/v1/price/history - Fetching price history (limit: ${limit})`);

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

    logger.info(`Successfully returned price history (${priceHistory.length} records)`);

    res.json(responseData);
  });

  getHealthCheck = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.debug('GET /health - Health check requested');

    const latestPrice = await this.priceService.getLatestPrice();
    const isHealthy = latestPrice !== null;
    const timeSinceUpdate = latestPrice 
      ? Date.now() - new Date(latestPrice.timestamp).getTime()
      : null;

    const healthData = {
      success: true,
      status: isHealthy ? 'healthy' : 'unhealthy',
      data: {
        service: 'bitcoin-price-service',
        timestamp: new Date().toISOString(),
        hasData: latestPrice !== null,
        lastUpdate: latestPrice?.timestamp || null,
        timeSinceLastUpdate: timeSinceUpdate,
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    const statusCode = isHealthy ? 200 : 503;
    
    logger.info(`Health check completed - Status: ${healthData.status}`);

    res.status(statusCode).json(healthData);
  });
}