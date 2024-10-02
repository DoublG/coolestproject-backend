import { Table, Column, Model, HasMany, DataType, Scopes } from 'sequelize-typescript';
import bcrypt from 'bcrypt';

@Scopes(() => ({
  event(eventId){
    return {
      where: {
        eventId: eventId
      }
    }
  }
}))
@Table
export class Account extends Model {
    @Column(DataType.STRING)
    password: string = "";

    @Column(DataType.ENUM('super_admin', 'admin', 'jury'))
    account_type: string = "";

    verifyPassword(password: string): boolean {
        return bcrypt.compareSync(password, this.password);
    }
}

/*
export const init = (sequelize: Sequelize) => {
  Account.init({
    email: {
      type: DataTypes.STRING(100),
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      get() {
        return this.getDataValue('password');
      },
      set(password: string) {
        const salt = bcrypt.genSaltSync(10); // Specify the salt rounds
        const hashedPassword = bcrypt.hashSync(password, salt);
        this.setDataValue('password', hashedPassword);
      },
    },
    account_type: DataTypes.ENUM('super_admin', 'admin', 'jury'),
  }, {
    sequelize,
    modelName: 'Account',
  });
}*/