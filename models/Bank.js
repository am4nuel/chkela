// models/Bank.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const Bank = sequelize.define(
    "Bank",
    {
      bankName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      accountNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateCreated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      dateUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true, // Automatically manages dateCreated and dateUpdated
      createdAt: "dateCreated",
      updatedAt: "dateUpdated",
    }
  );

  return Bank;
};
