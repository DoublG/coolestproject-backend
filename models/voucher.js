'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Voucher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Voucher.belongsTo(models.Project, { as: 'project' });
      Voucher.belongsTo(models.User, { as: 'participant' })
    }
  };
  Voucher.init({
    id: { type: DataTypes.UUID, primaryKey: true },
  }, {
    sequelize,
    modelName: 'Voucher',
  });
  return Voucher;
};
