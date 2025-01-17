"use strict";
module.exports = (sequelize, DataTypes) => {
  const UserInterest = sequelize.define("UserInterest", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    interest: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  UserInterest.associate = function (models) {
    // A user can have many interests
    UserInterest.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return UserInterest;
};
