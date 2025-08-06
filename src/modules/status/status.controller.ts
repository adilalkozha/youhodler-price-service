import { Controller, Get } from '@nestjs/common';
import { PriceWorkerService } from '../rabbitmq/price-worker.service';
import { config } from '../../config';

@Controller('api/v1/status')
export class StatusController {
  constructor(private readonly priceWorkerService: PriceWorkerService) {}

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
          symbol: config.binance.symbol,
          updateInterval: config.updateInterval,
          commission: config.commission,
        },
      },
    };
  }
}