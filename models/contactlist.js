'use strict';
module.exports = (sequelize, DataTypes) => {
  const contactlist = sequelize.define('contactlist', {
    firstname: {
      type: DataTypes.STRING
    },
    lastname: {
      type: DataTypes.STRING
    },
    language: {
      type: DataTypes.STRING
    },
    Age: {
      type: DataTypes.STRING
    },
    Photo: {
      type: DataTypes.STRING
    },
    Contact: {
      type: DataTypes.STRING
    },
    via: {
      type: DataTypes.STRING
    },
    gsm: {
      type: DataTypes.STRING
    },
    gsm_guardian: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING
    },
    email_guardian: {
      type: DataTypes.STRING
    }
  }, {
    freezeTableName: true,
    timestamps: false
  });
  return contactlist;
};
