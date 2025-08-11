import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

export interface PriceRecord {
  id?: number;
  symbol: string;
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  originalBidPrice: number;
  originalAskPrice: number;
  commission: number;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'prices',
  timestamps: true,
})
export class Price extends Model implements PriceRecord {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    field: 'symbol',
  })
  symbol!: string;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'bid_price',
    get(this: Price) {
      const value = this.getDataValue('bidPrice') as unknown as string | number;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  bidPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'ask_price',
    get(this: Price) {
      const value = this.getDataValue('askPrice') as unknown as string | number;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  askPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'mid_price',
    get(this: Price) {
      const value = this.getDataValue('midPrice') as unknown as string | number;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  midPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'original_bid_price',
    get(this: Price) {
      const value = this.getDataValue('originalBidPrice') as unknown as string | number;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  originalBidPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'original_ask_price',
    get(this: Price) {
      const value = this.getDataValue('originalAskPrice') as unknown as string | number;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  originalAskPrice!: number;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: false,
    field: 'commission',
    get(this: Price) {
      const value = this.getDataValue('commission') as unknown as string | number;
      return typeof value === 'string' ? parseFloat(value) : value;
    },
  })
  commission!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'timestamp',
  })
  timestamp!: Date;
}