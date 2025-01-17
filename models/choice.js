"use strict";
module.exports = (sequelize, DataTypes) => {
  const Choice = sequelize.define(
    "Choice",
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isCorrect: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Questions",
          key: "id",
        },
      },
    },
    {}
  );
  Choice.associate = function (models) {
    // associations can be defined here
    Choice.belongsTo(models.Question, {
      foreignKey: "questionId",
      onDelete: "CASCADE", // Cascade delete questions when a quiz is deleted
      onUpdate: "CASCADE",
    });
  };
  return Choice;
};
