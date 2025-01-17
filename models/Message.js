module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("Message", {
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT, // Use TEXT to accommodate longer messages
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN, // Change the data type to BOOLEAN
      allowNull: false,
      defaultValue: false, // You can also set a default value
    },fileName: {
      type: DataTypes.STRING(500), // Change the data type to BOOLEAN
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.STRING(1000), // Change the data type to BOOLEAN
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automatically set to the current date and time
    },
  });
  Message.associate = function (models) {
    // A Message belongs to a sender (User)
    Message.belongsTo(models.User, {
  foreignKey: "senderId",
  as: "Sender",
  onDelete: "CASCADE", // When the sender is deleted, all their messages are deleted
});

Message.belongsTo(models.User, {
  foreignKey: "receiverId",
  as: "Receiver",
  onDelete: "CASCADE", // When the receiver is deleted, all their messages are deleted
});

  };

  return Message;
};
