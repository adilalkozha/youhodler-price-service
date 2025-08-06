import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export interface PriceUpdateMessage {
  symbol: string;
  timestamp: Date;
  action: 'fetch' | 'cleanup';
}

@Injectable()
export class RabbitmqService implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(
    @Inject('PRICE_SERVICE') private readonly priceClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.priceClient.connect();
    this.logger.log('Connected to RabbitMQ');
  }

  async onModuleDestroy() {
    await this.priceClient.close();
    this.logger.log('Disconnected from RabbitMQ');
  }

  sendPriceUpdateMessage(message: PriceUpdateMessage): Observable<any> {
    this.logger.debug('Sending price update message', message);
    return this.priceClient.send('price.update', message);
  }

  emitPriceFetchEvent(symbol: string): Observable<any> {
    const message: PriceUpdateMessage = {
      symbol,
      timestamp: new Date(),
      action: 'fetch'
    };
    
    this.logger.debug('Emitting price fetch event', message);
    return this.priceClient.emit('price.fetch', message);
  }

  emitPriceCleanupEvent(symbol: string): Observable<any> {
    const message: PriceUpdateMessage = {
      symbol,
      timestamp: new Date(),
      action: 'cleanup'
    };
    
    this.logger.debug('Emitting price cleanup event', message);
    return this.priceClient.emit('price.cleanup', message);
  }
}