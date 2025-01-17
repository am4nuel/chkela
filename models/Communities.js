"use strict";
module.exports = (sequelize, DataTypes) => {
  const Community = sequelize.define(
    "Community",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      ownerId: {
        type: DataTypes.INTEGER, // Updated to INTEGER to match User ID type
        allowNull: false,
      },
      profileImagePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bannerImagePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lat: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lng: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      getterMethods: {
        communityId() {
          return this.id ? `CHK${this.id}CMT` : null;
        },
      },
    }
  );

  Community.associate = function (models) {
    // A community is owned by a user
    Community.belongsTo(models.User, {
      foreignKey: "ownerId",
      as: "Owner",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // A community has many posts
    Community.hasMany(models.Post, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // A community can be followed (represented in the FollowingTracker model)
    Community.hasMany(models.FollowCommunity, {
      foreignKey: "followed",
      as: "Followers",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Community;
};
