import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { BinanceHealthIndicator } from './binance-health.indicator';
import { PriceModule } from '../price/price.module';

@Module({
  imports: [TerminusModule, PriceModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, BinanceHealthIndicator],
})
export class HealthModule {}