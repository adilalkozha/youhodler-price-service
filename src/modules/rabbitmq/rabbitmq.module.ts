import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';
import { PriceWorkerService } from './price-worker.service';
import { PriceModule } from '../price/price.module';
import { MetricsModule } from '../metrics/metrics.module';
import { config } from '../../config';

@Module({
  imports: [
    PriceModule,
    MetricsModule,
    ClientsModule.register([
      {
        name: 'PRICE_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [config.rabbitmq?.url || 'amqp://localhost:5672'],
          queue: 'price_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [RabbitmqService, PriceWorkerService],
  exports: [RabbitmqService, PriceWorkerService],
})
export class RabbitmqModule {}