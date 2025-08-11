import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestsTotal: Counter<string>;
  public readonly binanceApiRequestsTotal: Counter<string>;
  public readonly binanceApiRequestDuration: Histogram<string>;
  public readonly priceUpdatesTotal: Counter<string>;
  public readonly lastPriceUpdateTimestamp: Gauge<string>;
  public readonly currentBitcoinPrice: Gauge<string>;
  public readonly backgroundWorkerStatus: Gauge<string>;
  public readonly consecutiveErrors: Gauge<string>;

  constructor() {
    collectDefaultMetrics({ register });
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
    });

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.binanceApiRequestsTotal = new Counter({
      name: 'binance_api_requests_total',
      help: 'Total number of Binance API requests',
      labelNames: ['status'],
    });

    this.binanceApiRequestDuration = new Histogram({
      name: 'binance_api_request_duration_seconds',
      help: 'Duration of Binance API requests in seconds',
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.priceUpdatesTotal = new Counter({
      name: 'price_updates_total',
      help: 'Total number of price updates',
      labelNames: ['status'],
    });

    this.lastPriceUpdateTimestamp = new Gauge({
      name: 'last_price_update_timestamp',
      help: 'Timestamp of the last successful price update',
    });

    this.currentBitcoinPrice = new Gauge({
      name: 'current_bitcoin_price',
      help: 'Current Bitcoin price (mid price)',
    });

    this.backgroundWorkerStatus = new Gauge({
      name: 'background_worker_status',
      help: 'Status of the background worker (1 = running, 0 = stopped)',
    });

    this.consecutiveErrors = new Gauge({
      name: 'consecutive_errors',
      help: 'Number of consecutive errors in background worker',
    });
  }

  async getMetrics(): Promise<string> {
    return await register.metrics();
  }

  updateBinanceMetrics(success: boolean, duration: number): void {
    const status = success ? 'success' : 'error';
    this.binanceApiRequestsTotal.labels(status).inc();
    this.binanceApiRequestDuration.observe(duration);
  }


  updatePriceMetrics(success: boolean, price?: number): void {
    const status = success ? 'success' : 'error';
    this.priceUpdatesTotal.labels(status).inc();
    
    if (success && price !== undefined) {
      this.lastPriceUpdateTimestamp.setToCurrentTime();
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (!isNaN(numericPrice)) {
        this.currentBitcoinPrice.set(numericPrice);
      }
    }
  }

  updateWorkerMetrics(isRunning: boolean, errors: number): void {
    this.backgroundWorkerStatus.set(isRunning ? 1 : 0);
    this.consecutiveErrors.set(errors);
  }

  updateHttpMetrics(method: string, route: string, statusCode: string, duration: number): void {
    this.httpRequestDuration
      .labels(method, route, statusCode)

      .observe(duration);
    
    this.httpRequestsTotal
      .labels(method, route, statusCode)
      .inc();
  }
}