export interface AppConfig {
  port: number;
  updateInterval: number;
  commission: number;
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  binance: {
    baseUrl: string;
    symbol: string;
  };
  rabbitmq?: {
    url: string;
  };
} 