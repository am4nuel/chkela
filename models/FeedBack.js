// models/User.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const FeedBack = sequelize.define("FeedBack", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },

    feedBack: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  FeedBack.associate = function (models) {
    // Reply belongs to Comment
    FeedBack.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return FeedBack;
};
