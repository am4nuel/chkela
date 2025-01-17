"use strict";
module.exports = (sequelize, DataTypes) => {
  const Scholar = sequelize.define(
    "Scholar",
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
  );
  return Scholar;
};
