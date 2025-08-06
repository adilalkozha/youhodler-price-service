import { Column, Model, Table, DataType, Index } from 'sequelize-typescript';
import { PriceRecord } from '../types';

@Table({
  tableName: 'prices',
  timestamps: true,
  indexes: [
    {
      fields: ['symbol', 'timestamp'],
    },
    {
      fields: ['timestamp'],
    },
  ],
})
export class Price extends Model<PriceRecord> implements PriceRecord {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  public id!: number;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  })
  @Index('idx_symbol')
  public symbol!: string;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  public bidPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  public askPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  public midPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  public originalBidPrice!: number;

  @Column({
    type: DataType.DECIMAL(20, 8),
    allowNull: false,
    validate: {
      min: 0,
    },
  })
  public originalAskPrice!: number;

  @Column({
    type: DataType.DECIMAL(5, 4),
    allowNull: false,
    validate: {
      min: 0,
      max: 1,
    },
  })
  public commission!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  @Index('idx_timestamp')
  public timestamp!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}