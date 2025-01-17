"use strict";
module.exports = (sequelize, DataTypes) => {
  const FollowUser = sequelize.define("FollowUser", {
    follower: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    followed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  });

  FollowUser.associate = function (models) {
    // A user follows another user
    FollowUser.belongsTo(models.User, {
      foreignKey: "follower",
      as: "FollowerUser",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    FollowUser.belongsTo(models.User, {
      foreignKey: "followed",
      as: "FollowedUser",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return FollowUser;
};
