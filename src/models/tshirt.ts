import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { Event } from './index.js';

@Table
export class TShirt extends Model {
    @ForeignKey(() => Event)
    @Column
    declare eventId: number;

    @BelongsTo(() => Event)
    declare event: Event;

    @Column(DataType.STRING)
    declare name: string;
}
