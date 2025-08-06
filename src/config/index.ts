import dotenv from 'dotenv';
import Joi from 'joi';
import { ConfigType } from '../types';

dotenv.config();

const configSchema = Joi.object({
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
  
  RABBITMQ_URL: Joi.string().uri().default('amqp://localhost:5672'),
  
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});

const { error, value: envVars } = configSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config: ConfigType = {
  port: envVars.PORT,
  updateInterval: envVars.UPDATE_INTERVAL,
  commission: envVars.SERVICE_COMMISSION,
  database: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    username: envVars.DB_USERNAME,
    password: envVars.DB_PASSWORD,
  },
  binance: {
    baseUrl: envVars.BINANCE_BASE_URL,
    symbol: envVars.BINANCE_SYMBOL,
  },
  rabbitmq: {
    url: envVars.RABBITMQ_URL,
  },
};

export const nodeEnv = envVars.NODE_ENV;
export const logLevel = envVars.LOG_LEVEL;