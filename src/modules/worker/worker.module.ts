import { Module } from '@nestjs/common';
import { PriceWorkerService } from './price-worker.service';
import { PriceModule } from '../price/price.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    PriceModule,
    MetricsModule,
  ],
  providers: [PriceWorkerService],
  exports: [PriceWorkerService],
})
export class WorkerModule { }