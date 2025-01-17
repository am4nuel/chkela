"use strict";
module.exports = (sequelize, DataTypes) => {
  const Reply = sequelize.define(
    "Reply",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      parentReplyId: {
        // Renamed for clarity
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Replies",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      commentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Comments",
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
        replyId() {
          return this.id ? `CHK${this.id}RPL` : null;
        },
      },
    }
  );

  Reply.associate = function (models) {
    // Reply belongs to User
    Reply.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Reply belongs to Comment
    Reply.belongsTo(models.Comment, {
      foreignKey: "commentId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Reply may have many child replies
    Reply.hasMany(models.Reply, {
      foreignKey: "parentReplyId",
      as: "ParentReply", // Alias for the association
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Reply;
};
