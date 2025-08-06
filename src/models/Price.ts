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
  })
  bidPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'ask_price',
  })
  askPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'mid_price',
  })
  midPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'original_bid_price',
  })
  originalBidPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    field: 'original_ask_price',
  })
  originalAskPrice!: number;

  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: false,
    field: 'commission',
  })
  commission!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'timestamp',
  })
  timestamp!: Date;
}