// models/User.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const UserStatistics = sequelize.define(
    "UserStatistics",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      point: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      privilege: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "active",
      },
      paymentStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "unpaid",
      },
      pricePackage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentState: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "online",
      },
    },
    {
      getterMethods: {
        userId() {
          return this.id ? `CHK${this.id}USRST` : null;
        },
      },
    }
  );

  UserStatistics.associate = function (models) {
    // Reply belongs to Comment
    UserStatistics.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return UserStatistics;
};
