import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: isProd
            ? winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
              )
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(({ level, message, timestamp, stack, context, ...meta }) => {
                  const ctx = context ? ` [${context}]` : '';
                  const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  return `${timestamp} ${level}${ctx}: ${stack ?? message}${extras}`;
                }),
              ),
        }),
      ],
    }),
  ],
})
export class LoggingModule {}


