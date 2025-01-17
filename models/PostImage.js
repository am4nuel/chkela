// models/PostImage.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const PostImage = sequelize.define("PostImage", {
    imagePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Posts",
        key: "id",
      },
    },
  });

  PostImage.associate = function (models) {
    // PostImage belongs to Post
    PostImage.belongsTo(models.Post, {
      foreignKey: "postId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return PostImage;
};
