import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const binanceApiRequestsTotal = new Counter({
  name: 'binance_api_requests_total',
  help: 'Total number of Binance API requests',
  labelNames: ['status'],
});

export const binanceApiRequestDuration = new Histogram({
  name: 'binance_api_request_duration_seconds',
  help: 'Duration of Binance API requests in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const priceUpdatesTotal = new Counter({
  name: 'price_updates_total',
  help: 'Total number of price updates',
  labelNames: ['status'],
});

export const lastPriceUpdateTimestamp = new Gauge({
  name: 'last_price_update_timestamp',
  help: 'Timestamp of the last successful price update',
});

export const currentBitcoinPrice = new Gauge({
  name: 'current_bitcoin_price',
  help: 'Current Bitcoin price (mid price)',
});

export const backgroundWorkerStatus = new Gauge({
  name: 'background_worker_status',
  help: 'Status of the background worker (1 = running, 0 = stopped)',
});

export const consecutiveErrors = new Gauge({
  name: 'consecutive_errors',
  help: 'Number of consecutive errors in background worker',
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
};

export const getMetricsHandler = async (req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export const updateBinanceMetrics = (success: boolean, duration: number): void => {
  const status = success ? 'success' : 'error';
  binanceApiRequestsTotal.labels(status).inc();
  binanceApiRequestDuration.observe(duration);
};

export const updatePriceMetrics = (success: boolean, price?: number): void => {
  const status = success ? 'success' : 'error';
  priceUpdatesTotal.labels(status).inc();
  
  if (success && price) {
    lastPriceUpdateTimestamp.setToCurrentTime();
    currentBitcoinPrice.set(price);
  }
};

export const updateWorkerMetrics = (isRunning: boolean, errors: number): void => {
  backgroundWorkerStatus.set(isRunning ? 1 : 0);
  consecutiveErrors.set(errors);
};