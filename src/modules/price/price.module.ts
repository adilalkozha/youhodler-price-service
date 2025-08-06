import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { BinanceService } from './binance.service';
import { PriceCalculatorService } from './price-calculator.service';
import { Price } from '../../models/Price';

@Module({
  imports: [SequelizeModule.forFeature([Price])],
  controllers: [PriceController],
  providers: [PriceService, BinanceService, PriceCalculatorService],
  exports: [PriceService],
})
export class PriceModule {}