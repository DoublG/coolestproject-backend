'use strict';
module.exports = (sequelize, DataTypes) => {
  const useronly = sequelize.define('ShowUserWithNoProject', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    firstname: {
      type: DataTypes.STRING
    },
    lastname: {
      type: DataTypes.STRING

    },
    email: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
  return useronly;
};