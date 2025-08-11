import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { TerminusModule } from '@nestjs/terminus';
import { PriceModule } from './modules/price/price.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { WorkerModule } from './modules/worker/worker.module';
import { StatusModule } from './modules/status/status.module';
import { Price } from './models/Price';
import Joi from 'joi';
import { ConfigService } from '@nestjs/config';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().port().default(3000),
        UPDATE_INTERVAL: Joi.number().min(1000).default(10000),
        SERVICE_COMMISSION: Joi.number().min(0).max(1).default(0.0001),

        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(5432),
        DB_NAME: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),

        BINANCE_BASE_URL: Joi.string().uri().default('https://api.binance.com'),
        BINANCE_SYMBOL: Joi.string().default('BTCUSDT'),

        LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
      }),
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        models: [Price],
        autoLoadModels: true,
        synchronize: false,
      }),
    }),
    TerminusModule,
    PriceModule,
    HealthModule,
    MetricsModule,
    LoggingModule,
    WorkerModule,
    StatusModule,
  ],
})
export class AppModule {}