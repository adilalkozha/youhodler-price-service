import request from 'supertest';
import express from 'express';
import { PriceController } from '../../controllers/priceController';
import { PriceService } from '../../services/priceService';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';
import { PriceRecord } from '../../types';

jest.mock('../../services/priceService');
jest.mock('../../config/logger');

const MockedPriceService = PriceService as jest.MockedClass<typeof PriceService>;

describe('API Integration Tests', () => {
  let app: express.Application;
  let mockPriceService: jest.Mocked<PriceService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockPriceService = new MockedPriceService(
      {} as any,
      {} as any,
      {} as any,
      'BTCUSDT'
    ) as jest.Mocked<PriceService>;

    const priceController = new PriceController(mockPriceService);

    app = express();
    app.use(express.json());
    app.get('/api/v1/price', priceController.getCurrentPrice);
    app.get('/api/v1/price/history', priceController.getPriceHistory);
    app.get('/health', priceController.getHealthCheck);
    app.use(notFoundHandler);
    app.use(errorHandler);
  });

  describe('GET /api/v1/price', () => {
    const mockPriceRecord: PriceRecord = {
      id: 1,
      symbol: 'BTCUSDT',
      bidPrice: 49950.0,
      askPrice: 50150.1,
      midPrice: 50050.05,
      originalBidPrice: 50000.0,
      originalAskPrice: 50100.0,
      commission: 0.001,
      timestamp: new Date('2024-01-01T12:00:00Z'),
      createdAt: new Date('2024-01-01T12:00:00Z'),
      updatedAt: new Date('2024-01-01T12:00:00Z'),
    };

    it('should return current price successfully', async () => {
      mockPriceService.getLatestPrice.mockResolvedValue(mockPriceRecord);

      const response = await request(app)
        .get('/api/v1/price')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          symbol: 'BTCUSDT',
          bidPrice: 49950.0,
          askPrice: 50150.1,
          midPrice: 50050.05,
          timestamp: '2024-01-01T12:00:00.000Z',
          commission: 0.001,
          spread: 200.1,
          spreadPercentage: 0.3999,
        },
        meta: {
          lastUpdated: '2024-01-01T12:00:00.000Z',
          recordId: 1,
        },
      });

      expect(mockPriceService.getLatestPrice).toHaveBeenCalledTimes(1);
    });

    it('should return 503 when no price data available', async () => {
      mockPriceService.getLatestPrice.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/price')
        .expect(503);

      expect(response.body).toEqual({
        success: false,
        error: 'No price data available. Please try again later.',
      });
    });

    it('should handle service errors', async () => {
      mockPriceService.getLatestPrice.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/price')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal Server Error',
        message: 'Something went wrong. Please try again later.',
      });
    });
  });

  describe('GET /api/v1/price/history', () => {
    const mockPriceHistory: PriceRecord[] = [
      {
        id: 2,
        symbol: 'BTCUSDT',
        bidPrice: 49950.0,
        askPrice: 50150.1,
        midPrice: 50050.05,
        originalBidPrice: 50000.0,
        originalAskPrice: 50100.0,
        commission: 0.001,
        timestamp: new Date('2024-01-01T12:05:00Z'),
        createdAt: new Date('2024-01-01T12:05:00Z'),
        updatedAt: new Date('2024-01-01T12:05:00Z'),
      },
      {
        id: 1,
        symbol: 'BTCUSDT',
        bidPrice: 49940.0,
        askPrice: 50140.1,
        midPrice: 50040.05,
        originalBidPrice: 49990.0,
        originalAskPrice: 50090.0,
        commission: 0.001,
        timestamp: new Date('2024-01-01T12:00:00Z'),
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      },
    ];

    it('should return price history with default limit', async () => {
      mockPriceService.getPriceHistory.mockResolvedValue(mockPriceHistory);

      const response = await request(app)
        .get('/api/v1/price/history')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [
          {
            id: 2,
            symbol: 'BTCUSDT',
            bidPrice: 49950.0,
            askPrice: 50150.1,
            midPrice: 50050.05,
            commission: 0.001,
            timestamp: '2024-01-01T12:05:00.000Z',
          },
          {
            id: 1,
            symbol: 'BTCUSDT',
            bidPrice: 49940.0,
            askPrice: 50140.1,
            midPrice: 50040.05,
            commission: 0.001,
            timestamp: '2024-01-01T12:00:00.000Z',
          },
        ],
        meta: {
          count: 2,
          limit: 100,
        },
      });

      expect(mockPriceService.getPriceHistory).toHaveBeenCalledWith(100);
    });

    it('should return price history with custom limit', async () => {
      mockPriceService.getPriceHistory.mockResolvedValue([mockPriceHistory[0]]);

      const response = await request(app)
        .get('/api/v1/price/history?limit=1')
        .expect(200);

      expect(response.body.meta.limit).toBe(1);
      expect(response.body.data).toHaveLength(1);
      expect(mockPriceService.getPriceHistory).toHaveBeenCalledWith(1);
    });

    it('should reject invalid limit (too small)', async () => {
      const response = await request(app)
        .get('/api/v1/price/history?limit=0')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Limit must be between 1 and 1000',
      });
    });

    it('should reject invalid limit (too large)', async () => {
      const response = await request(app)
        .get('/api/v1/price/history?limit=1001')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Limit must be between 1 and 1000',
      });
    });
  });

  describe('GET /health', () => {
    it('should return healthy status when data is available', async () => {
      const mockPriceRecord: PriceRecord = {
        id: 1,
        symbol: 'BTCUSDT',
        bidPrice: 49950.0,
        askPrice: 50150.1,
        midPrice: 50050.05,
        originalBidPrice: 50000.0,
        originalAskPrice: 50100.0,
        commission: 0.001,
        timestamp: new Date('2024-01-01T12:00:00Z'),
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
      };

      mockPriceService.getLatestPrice.mockResolvedValue(mockPriceRecord);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.data.hasData).toBe(true);
      expect(response.body.data.lastUpdate).toBe('2024-01-01T12:00:00.000Z');
      expect(response.body.data.timeSinceLastUpdate).toBeGreaterThan(0);
    });

    it('should return unhealthy status when no data is available', async () => {
      mockPriceService.getLatestPrice.mockResolvedValue(null);

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.data.hasData).toBe(false);
      expect(response.body.data.lastUpdate).toBeNull();
      expect(response.body.data.timeSinceLastUpdate).toBeNull();
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Route not found',
        message: 'Cannot GET /api/v1/unknown',
      });
    });
  });
});