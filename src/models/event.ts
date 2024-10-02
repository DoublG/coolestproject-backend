import { Table, Column, Model, HasMany, DataType } from 'sequelize-typescript';

@Table
export class Event extends Model {
  @Column(DataType.STRING)
  declare azure_storage_container: String;

  @Column(DataType.NUMBER)
  declare minAge: number;

  @Column(DataType.NUMBER)
  declare maxAge: number;

  @Column(DataType.NUMBER)
  declare minGuardianAge: number;

  @Column(DataType.NUMBER)
  declare maxRegistration: number;

  @Column(DataType.NUMBER)
  declare maxVoucher: number;

  @Column(DataType.DATE)
  declare eventBeginDate: Date;

  @Column(DataType.DATE)
  declare registrationOpenDate: Date;

  @Column(DataType.DATE)
  declare registrationClosedDate: Date;

  @Column(DataType.DATE)
  declare projectClosedDate: Date;

  @Column(DataType.DATE)
  declare officialStartDate: Date;

  @Column(DataType.DATE)
  declare eventEndDate: Date;

  @Column(DataType.STRING)
  declare event_title: string;

  @Column(DataType.NUMBER)
  declare maxFileSize: number;
}