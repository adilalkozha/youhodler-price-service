import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { TerminusModule } from '@nestjs/terminus';
import { PriceModule } from './modules/price/price.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { RabbitmqModule } from './modules/rabbitmq/rabbitmq.module';
import { StatusModule } from './modules/status/status.module';
import { config } from './config';
import { Price } from './features/price/models/Price';
import { User } from './features/user/models/User';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.name,
      models: [Price, User],
      autoLoadModels: true,
      synchronize: false,
    }),
    TerminusModule,
    PriceModule,
    HealthModule,
    MetricsModule,
    RabbitmqModule,
    StatusModule,
  ],
})
export class AppModule {}