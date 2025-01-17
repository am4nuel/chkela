// models/GuideVideo.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const GuideVideo = sequelize.define(
    "GuideVideo",
    {
      link: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      // Additional model options
      timestamps: true, // Automatically manage createdAt and updatedAt fields
    }
  );

  return GuideVideo;
};
