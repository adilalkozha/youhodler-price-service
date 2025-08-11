import { Controller, Get } from '@nestjs/common';
import { PriceWorkerService } from '../worker/price-worker.service';
import { ConfigService } from '@nestjs/config';

@Controller('api/v1/status')
export class StatusController {
  constructor(
    private readonly priceWorkerService: PriceWorkerService,
    private readonly configService: ConfigService,
  ) { }

  @Get()
  getStatus() {
    const workerStatus = this.priceWorkerService.getStatus();
    
    return {
      success: true,
      data: {
        service: 'bitcoin-price-service',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        backgroundWorker: workerStatus,
        configuration: {
          symbol: this.configService.get<string>('BINANCE_SYMBOL', 'BTCUSDT'),
          updateInterval: this.configService.get<number>('UPDATE_INTERVAL', 10000),
          commission: this.configService.get<number>('SERVICE_COMMISSION', 0.0001),
        },
      },
    };
  }
}