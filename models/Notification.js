"use strict";
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING, // Fixed the data type
        allowNull: false,
      },
      content: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payload: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN, // Fixed the data type
        defaultValue: false,
      },
    },
    {
      timestamps: true,
    }
  );

  // Define association
  Notification.associate = function (models) {
    Notification.belongsTo(models.User, {
      foreignKey: "userId",
      as: "User",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Notification;
};
