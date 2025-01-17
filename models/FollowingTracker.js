"use strict";
module.exports = (sequelize, DataTypes) => {
  const FollowingTracker = sequelize.define("FollowingTracker", {
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
    },
    followedType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["User", "Community"]],
      },
    },
  });

  FollowingTracker.associate = function (models) {
    // A user can follow many users (follower)
    FollowingTracker.belongsTo(models.User, {
      foreignKey: "follower",
      as: "FollowerUser",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // A user can be followed by many users (followed) OR a Community can be followed by many users
    FollowingTracker.belongsTo(models.User, {
      foreignKey: "followed",
      as: "FollowedUser",
      constraints: false, // Disable constraint for dynamic association
    });

    FollowingTracker.belongsTo(models.Community, {
      foreignKey: "followed",
      as: "FollowedCommunity",
      constraints: false, // Disable constraint for dynamic association
    });
  };

  return FollowingTracker;
};
