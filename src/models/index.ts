import { Sequelize } from 'sequelize-typescript';
import { Price } from '../features/price/models/Price';
import { User } from '../features/user/models/User';
import { logger } from '../config/logger';

export class Database {
  private sequelize: Sequelize;
  public Price: typeof Price;
  public User: typeof User;

  constructor(
    host: string,
    port: number,
    database: string,
    username: string,
    password: string
  ) {
    this.sequelize = new Sequelize({
      database,
      username,
      password,
      host,
      port,
      dialect: 'postgres',
      models: [Price, User],
      logging: (msg) => logger.debug(msg),
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      retry: {
        max: 3,
      },
    });

    this.Price = Price;
    this.User = User;
  }

  async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      logger.info('Database connection established successfully');
      
      await this.sequelize.sync({ alter: false });
      logger.info('Database models synchronized');
    } catch (error) {
      logger.error('Unable to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  getSequelize(): Sequelize {
    return this.sequelize;
  }
}

export { Price, User };