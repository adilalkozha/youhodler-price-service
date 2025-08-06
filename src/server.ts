import express from 'express';
import { config } from './config';
import { logger } from './config/logger';
import { Database } from './models';
import { BinanceClient } from './services/binanceClient';
import { PriceCalculator } from './services/priceCalculator';
import { PriceService } from './services/priceService';
import { BackgroundWorker } from './services/backgroundWorker';
import { PriceController } from './controllers/priceController';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { metricsMiddleware, getMetricsHandler, updateWorkerMetrics } from './middleware/metrics';

class Application {
  private app: express.Application;
  private database: Database;
  private binanceClient: BinanceClient;
  private priceCalculator: PriceCalculator;
  private priceService: PriceService;
  private backgroundWorker: BackgroundWorker;
  private priceController: PriceController;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private initializeServices(): void {
    this.database = new Database(
      config.database.host,
      config.database.port,
      config.database.name,
      config.database.username,
      config.database.password
    );

    this.binanceClient = new BinanceClient(
      config.binance.baseUrl,
      config.binance.symbol
    );

    this.priceCalculator = new PriceCalculator(config.commission);

    this.priceService = new PriceService(
      this.database,
      this.binanceClient,
      this.priceCalculator,
      config.binance.symbol
    );

    this.backgroundWorker = new BackgroundWorker(
      this.priceService,
      config.updateInterval
    );

    this.priceController = new PriceController(this.priceService);
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    this.app.use(metricsMiddleware);
  }

  private setupRoutes(): void {
    this.app.get('/health', this.priceController.getHealthCheck);
    this.app.get('/metrics', getMetricsHandler);
    
    this.app.get('/api/v1/price', this.priceController.getCurrentPrice);
    this.app.get('/api/v1/price/history', this.priceController.getPriceHistory);
    
    this.app.get('/api/v1/status', (req, res) => {
      const workerStatus = this.backgroundWorker.getStatus();
      updateWorkerMetrics(workerStatus.isRunning, workerStatus.consecutiveErrors);
      
      res.json({
        success: true,
        data: {
          service: 'bitcoin-price-service',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          backgroundWorker: workerStatus,
          configuration: {
            symbol: config.binance.symbol,
            updateInterval: config.updateInterval,
            commission: config.commission,
          },
        },
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  async start(): Promise<void> {
    try {
      await this.database.connect();
      logger.info('Database connected successfully');

      const isConnected = await this.binanceClient.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to Binance API');
      }
      logger.info('Binance API connection verified');

      this.backgroundWorker.start();
      logger.info('Background worker started');

      const server = this.app.listen(config.port, () => {
        logger.info(`Server is running on port ${config.port}`);
        logger.info(`Health check: http://localhost:${config.port}/health`);
        logger.info(`Metrics: http://localhost:${config.port}/metrics`);
        logger.info(`Price API: http://localhost:${config.port}/api/v1/price`);
      });

      const gracefulShutdown = async (signal: string): Promise<void> => {
        logger.info(`${signal} received. Starting graceful shutdown...`);
        
        this.backgroundWorker.stop();
        logger.info('Background worker stopped');
        
        server.close(async () => {
          logger.info('HTTP server closed');
          
          try {
            await this.database.disconnect();
            logger.info('Database connection closed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          }
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
    } catch (error) {
      logger.error('Failed to start application:', error);
      process.exit(1);
    }
  }
}

const application = new Application();
application.start().catch((error) => {
  logger.error('Unhandled error during startup:', error);
  process.exit(1);
});