// models/User.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      bankName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transactionNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      receiptImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "unapproved",
      },
       pricePackage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      getterMethods: {
        userId() {
          return this.id ? `CHK${this.id}PYT` : null;
        },
      },
    }
  );

  Payment.associate = function (models) {
    // Reply belongs to Comment
    Payment.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Payment;
};
