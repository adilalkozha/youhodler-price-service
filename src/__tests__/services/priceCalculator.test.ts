import { PriceCalculator } from '../../services/priceCalculator';
import { BinanceTickerResponse } from '../../types';

describe('PriceCalculator', () => {
  let priceCalculator: PriceCalculator;
  const testCommission = 0.001; // 0.1%

  beforeEach(() => {
    priceCalculator = new PriceCalculator(testCommission);
  });

  describe('constructor', () => {
    it('should create PriceCalculator with valid commission', () => {
      expect(priceCalculator.getCommission()).toBe(testCommission);
    });

    it('should throw error for negative commission', () => {
      expect(() => new PriceCalculator(-0.1)).toThrow('Commission must be between 0 and 1');
    });

    it('should throw error for commission greater than 1', () => {
      expect(() => new PriceCalculator(1.1)).toThrow('Commission must be between 0 and 1');
    });

    it('should accept commission of 0', () => {
      const calculator = new PriceCalculator(0);
      expect(calculator.getCommission()).toBe(0);
    });

    it('should accept commission of 1', () => {
      const calculator = new PriceCalculator(1);
      expect(calculator.getCommission()).toBe(1);
    });
  });

  describe('calculatePrice', () => {
    const mockTicker: BinanceTickerResponse = {
      symbol: 'BTCUSDT',
      bidPrice: '50000.00',
      askPrice: '50100.00',
      bidQty: '1.0',
      askQty: '1.0',
    };

    it('should calculate price correctly with commission', () => {
      const result = priceCalculator.calculatePrice(mockTicker);

      const expectedBidPrice = 50000 * (1 - testCommission); // 49950
      const expectedAskPrice = 50100 * (1 + testCommission); // 50150.1
      const expectedMidPrice = (expectedBidPrice + expectedAskPrice) / 2; // 50050.05

      expect(result.bidPrice).toBe(49950);
      expect(result.askPrice).toBe(50150.1);
      expect(result.midPrice).toBe(50050.05);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle zero commission', () => {
      const zeroCommissionCalculator = new PriceCalculator(0);
      const result = zeroCommissionCalculator.calculatePrice(mockTicker);

      expect(result.bidPrice).toBe(50000);
      expect(result.askPrice).toBe(50100);
      expect(result.midPrice).toBe(50050);
    });

    it('should round results to 8 decimal places', () => {
      const tickerWithPrecision: BinanceTickerResponse = {
        symbol: 'BTCUSDT',
        bidPrice: '50000.123456789',
        askPrice: '50100.987654321',
        bidQty: '1.0',
        askQty: '1.0',
      };

      const result = priceCalculator.calculatePrice(tickerWithPrecision);

      expect(result.bidPrice.toString().split('.')[1]?.length).toBeLessThanOrEqual(8);
      expect(result.askPrice.toString().split('.')[1]?.length).toBeLessThanOrEqual(8);
      expect(result.midPrice.toString().split('.')[1]?.length).toBeLessThanOrEqual(8);
    });

    it('should throw error for invalid bid price', () => {
      const invalidTicker: BinanceTickerResponse = {
        ...mockTicker,
        bidPrice: 'invalid',
      };

      expect(() => priceCalculator.calculatePrice(invalidTicker))
        .toThrow('Invalid price data received from Binance');
    });

    it('should throw error for invalid ask price', () => {
      const invalidTicker: BinanceTickerResponse = {
        ...mockTicker,
        askPrice: 'not-a-number',
      };

      expect(() => priceCalculator.calculatePrice(invalidTicker))
        .toThrow('Invalid price data received from Binance');
    });

    it('should throw error for negative bid price', () => {
      const negativeTicker: BinanceTickerResponse = {
        ...mockTicker,
        bidPrice: '-100',
      };

      expect(() => priceCalculator.calculatePrice(negativeTicker))
        .toThrow('Price values must be positive');
    });

    it('should throw error for zero ask price', () => {
      const zeroTicker: BinanceTickerResponse = {
        ...mockTicker,
        askPrice: '0',
      };

      expect(() => priceCalculator.calculatePrice(zeroTicker))
        .toThrow('Price values must be positive');
    });

    it('should throw error when bid price >= ask price', () => {
      const invalidSpreadTicker: BinanceTickerResponse = {
        ...mockTicker,
        bidPrice: '50100',
        askPrice: '50000',
      };

      expect(() => priceCalculator.calculatePrice(invalidSpreadTicker))
        .toThrow('Bid price cannot be greater than or equal to ask price');
    });

    it('should throw error when bid price equals ask price', () => {
      const equalPriceTicker: BinanceTickerResponse = {
        ...mockTicker,
        bidPrice: '50000',
        askPrice: '50000',
      };

      expect(() => priceCalculator.calculatePrice(equalPriceTicker))
        .toThrow('Bid price cannot be greater than or equal to ask price');
    });
  });

  describe('updateCommission', () => {
    it('should update commission successfully', () => {
      const newCommission = 0.002;
      priceCalculator.updateCommission(newCommission);
      expect(priceCalculator.getCommission()).toBe(newCommission);
    });

    it('should throw error for invalid commission', () => {
      expect(() => priceCalculator.updateCommission(-0.1))
        .toThrow('Commission must be between 0 and 1');
      expect(() => priceCalculator.updateCommission(1.1))
        .toThrow('Commission must be between 0 and 1');
    });
  });

  describe('calculateSpread', () => {
    it('should calculate spread correctly', () => {
      const spread = priceCalculator.calculateSpread(50000, 50100);
      expect(spread).toBe(100);
    });

    it('should handle zero spread', () => {
      const spread = priceCalculator.calculateSpread(50000, 50000);
      expect(spread).toBe(0);
    });
  });

  describe('calculateSpreadPercentage', () => {
    it('should calculate spread percentage correctly', () => {
      const spreadPercentage = priceCalculator.calculateSpreadPercentage(50000, 50100);
      expect(spreadPercentage).toBeCloseTo(0.1998, 4); // 100 / 50050 * 100
    });

    it('should handle zero spread percentage', () => {
      const spreadPercentage = priceCalculator.calculateSpreadPercentage(50000, 50000);
      expect(spreadPercentage).toBe(0);
    });
  });
});