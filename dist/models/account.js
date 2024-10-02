var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Table, Column, Model, DataType, Scopes } from 'sequelize-typescript';
import bcrypt from 'bcrypt';
let Account = class Account extends Model {
    password = "";
    account_type = "";
    verifyPassword(password) {
        return bcrypt.compareSync(password, this.password);
    }
};
__decorate([
    Column(DataType.STRING),
    __metadata("design:type", String)
], Account.prototype, "password", void 0);
__decorate([
    Column(DataType.ENUM('super_admin', 'admin', 'jury')),
    __metadata("design:type", String)
], Account.prototype, "account_type", void 0);
Account = __decorate([
    Scopes(() => ({
        event(eventId) {
            return {
                where: {
                    eventId: eventId
                }
            };
        }
    })),
    Table
], Account);
export { Account };
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
