"use strict";
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    "Post",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      ownerType: {
        type: DataTypes.STRING, // Store either 'User' or 'Community'
        allowNull: false,
      },
      upVotes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Default value of 0
      },
      downVotes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Default value of 0
      },
      comments: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Default value of 0
      },
      communityId: {
        type: DataTypes.INTEGER, // Store either 'User' or 'Community'
        allowNull: true,
      },
    },
    {
      getterMethods: {
        postId() {
          return this.id ? `CHK${this.id}PST` : null;
        },
      },
    }
  );

  Post.associate = function (models) {
    // Post belongs to User
    Post.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Post.belongsTo(models.Community, {
      foreignKey: "communityId", // Ensure this column exists in your Post table
      as: "Community",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    Post.hasMany(models.Comment, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Post.hasMany(models.Reaction, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    // Post has many PostImages
    Post.hasMany(models.PostImage, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Post;
};
