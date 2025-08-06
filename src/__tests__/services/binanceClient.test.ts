import axios from 'axios';
import { BinanceClient } from '../../services/binanceClient';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BinanceClient', () => {
  let binanceClient: BinanceClient;
  const baseUrl = 'https://api.binance.com';
  const symbol = 'BTCUSDT';

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
    binanceClient = new BinanceClient(baseUrl, symbol);
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: baseUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('getBookTicker', () => {
    const mockResponse = {
      data: {
        symbol: 'BTCUSDT',
        bidPrice: '50000.00',
        askPrice: '50100.00',
        bidQty: '1.0',
        askQty: '1.0',
      },
    };

    it('should fetch book ticker successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await binanceClient.getBookTicker();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ticker/bookTicker', {
        params: { symbol },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle rate limit error (429)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 429, statusText: 'Too Many Requests', data: {} },
        message: 'Rate limit exceeded',
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(binanceClient.getBookTicker())
        .rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle invalid symbol error (400)', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 400, statusText: 'Bad Request', data: {} },
        message: 'Invalid symbol',
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(binanceClient.getBookTicker())
        .rejects.toThrow(`Invalid symbol: ${symbol}`);
    });

    it('should handle timeout error', async () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(binanceClient.getBookTicker())
        .rejects.toThrow('Request timeout. Binance API might be slow.');
    });

    it('should handle connection error', async () => {
      const error = {
        isAxiosError: true,
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.binance.com',
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(binanceClient.getBookTicker())
        .rejects.toThrow('Unable to connect to Binance API. Check your internet connection.');
    });

    it('should handle connection refused error', async () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      };
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(binanceClient.getBookTicker())
        .rejects.toThrow('Unable to connect to Binance API. Check your internet connection.');
    });

    it('should handle unexpected error', async () => {
      const error = new Error('Unexpected error');
      mockedAxios.get.mockRejectedValueOnce(error);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(binanceClient.getBookTicker())
        .rejects.toThrow('Failed to fetch price data from Binance');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });

      const result = await binanceClient.testConnection();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v3/ping');
      expect(result).toBe(true);
    });

    it('should return false for failed connection test', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await binanceClient.testConnection();

      expect(result).toBe(false);
    });
  });
});