"use strict";
module.exports = (sequelize, DataTypes) => {
  const Reaction = sequelize.define("Reaction", {
    postId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Posts", // Assuming the Message model is defined in the database
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    like: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    sick: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    haha: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    wow: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    sad: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    angry: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    skull: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    heartBreak: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    fire: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  });

  Reaction.associate = function (models) {
    // A Reaction belongs to a Message
    Reaction.belongsTo(models.Message, {
      foreignKey: "postId",
      as: "Post",
    });
  };

  return Reaction;
};
