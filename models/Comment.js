// models/Comment.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
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
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Posts",
          key: "id",
        },
      },
      likeCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      disLikeCount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      getterMethods: {
        commentId() {
          return this.id ? `CHK${this.id}CMT` : null;
        },
      },
    }
  );

  Comment.associate = function (models) {
    // Comment belongs to User
    Comment.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Comment belongs to Post
    Comment.belongsTo(models.Post, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Comment has many Replies
    Comment.hasMany(models.Reply, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Comment;
};
