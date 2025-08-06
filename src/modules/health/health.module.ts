import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { BinanceHealthIndicator } from './binance-health.indicator';
import { Price } from '../../models/Price';
import { PriceModule } from '../price/price.module';

@Module({
  imports: [TerminusModule, SequelizeModule.forFeature([Price]), PriceModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, BinanceHealthIndicator],
})
export class HealthModule {}