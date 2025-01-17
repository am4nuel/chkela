"use strict";
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    schoolName: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "none",
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    profileImage: {
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
    promoCode: {
      type: DataTypes.STRING,
      allowNull: true, // Can be null initially
      unique: true,
    },
    fcmToken: {
      type: DataTypes.STRING(5000),
      allowNull: true, // Can be null initially
    },
  });
  // Associations
  User.associate = function (models) {
    User.hasMany(models.Notification, {
      foreignKey: "userId",
      as: "Notifications",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    User.hasMany(models.Post, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    User.hasMany(models.Message, {
      foreignKey: "senderId",
      onDelete: "CASCADE", // When a user is deleted, all their sent messages are deleted
      onUpdate: "CASCADE",
    });

    User.hasMany(models.Message, {
      foreignKey: "receiverId",
      onDelete: "CASCADE", // When a user is deleted, all their received messages are deleted
      onUpdate: "CASCADE",
    });

    User.hasMany(models.Comment, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.Reply, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.UserStatistics, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.Payment, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.FollowUser, {
      foreignKey: "follower",
      as: "FollowingUsers",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.FollowUser, {
      foreignKey: "followed",
      as: "FollowedByUsers",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.FollowCommunity, {
      foreignKey: "follower",
      as: "FollowingCommunities",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.Referral, {
      foreignKey: "referred",
      as: "Referrals",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    User.hasMany(models.Referral, {
      foreignKey: "referredBy",
      as: "ReferralsMade",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return User;
};
