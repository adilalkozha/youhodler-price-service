import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { BinanceService } from './binance.service';
import { PriceCalculatorService } from './price-calculator.service';
import { MetricsModule } from '../metrics/metrics.module';
import { Price } from '../../features/price/models/Price';

@Module({
  imports: [SequelizeModule.forFeature([Price]), MetricsModule],
  controllers: [PriceController],
  providers: [PriceService, BinanceService, PriceCalculatorService],
  exports: [PriceService, BinanceService],
})
export class PriceModule {}