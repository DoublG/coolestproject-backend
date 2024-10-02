import { Table, Column, Model, HasMany, DataType, HasOne, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Event, TShirt } from './index.js';

@Table
export class User extends Model {
  @Column(DataType.STRING)
  declare firstName: string;

  @Column(DataType.STRING)
  declare lastName: string;

  @Column(DataType.STRING)
  declare email: string;

  @BelongsTo(() => Event)
  declare event: Event;

  @ForeignKey(() => Event)
  @Column
  declare eventId: number;

  @BelongsTo(() => TShirt)
  declare tshirt: TShirt;

  @ForeignKey(() => TShirt)
  @Column
  declare sizeId: number;

/*
  @Column(DataType.STRING)
  declare phoneNumber: string;

  @Column(DataType.INTEGER)
  declare eventId: number;


  @Column(DataType.STRING)
@ForeignKey(() => Event)
  @Column
  declare eventId: number;

  @BelongsTo(() => Event)
  declare event: Event;

  @HasOne(() => Event)
  declare event: Event;

  @HasMany(() => Tshirt)
  declare tshirts: Tshirt[];
  declare email: string;
  */
}
