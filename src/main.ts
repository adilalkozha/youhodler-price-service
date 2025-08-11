import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './modules/metrics/metrics.service';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const metricsService = app.get(MetricsService);
  const configService = app.get(ConfigService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  // Removed RMQ microservice connection as RabbitMQ features are no longer used
  
  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.log(`${signal} received. Starting graceful shutdown...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`📈 Metrics: http://localhost:${port}/metrics`);
  logger.log(`💰 Price API: http://localhost:${port}/api/v1/price`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Unhandled error during startup:', error);
  process.exit(1);
});