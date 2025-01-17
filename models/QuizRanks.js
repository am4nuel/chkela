// models/User.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const QuizRank = sequelize.define(
    "QuizRank",
    {
      hit: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      miss: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      quizId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      scheduledFor: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      getterMethods: {
        userId() {
          return this.id ? `CHK${this.id}QRN` : null;
        },
      },
    }
  );

  QuizRank.associate = function (models) {
    QuizRank.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return QuizRank;
};
