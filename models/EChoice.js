"use strict";
module.exports = (sequelize, DataTypes) => {
  const EChoice = sequelize.define(
    "EChoice",
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isCorrect: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      choiceImage: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "EQuestions",
          key: "id",
        },
      },
    },
    {}
  );
  EChoice.associate = function (models) {
    // associations can be defined here
    EChoice.belongsTo(models.EQuestion, {
      foreignKey: "questionId",
      onDelete: "CASCADE", // Cascade delete questions when a quiz is deleted
      onUpdate: "CASCADE",
    });
  };
  return EChoice;
};
