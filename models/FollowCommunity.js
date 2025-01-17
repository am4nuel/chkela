"use strict";
module.exports = (sequelize, DataTypes) => {
  const FollowCommunity = sequelize.define("FollowCommunity", {
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
        model: "Communities",
        key: "id",
      },
    },
  });

  FollowCommunity.associate = function (models) {
    // A user follows a community
    FollowCommunity.belongsTo(models.User, {
      foreignKey: "follower",
      as: "FollowerUser",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    FollowCommunity.belongsTo(models.Community, {
      foreignKey: "followed",
      as: "FollowedCommunity",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return FollowCommunity;
};
