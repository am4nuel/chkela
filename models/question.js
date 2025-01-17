"use strict";
module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define(
    "Question",
    {
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quizId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Quizzes",
          key: "id",
        },
      },
      chapter: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      hasContentToread: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hasImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {}
  );
  Question.associate = function (models) {
    Question.belongsTo(models.Exam, {
      foreignKey: "quizId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Question.belongsTo(models.Quiz, {
      foreignKey: "quizId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Question.hasMany(models.Choice, {
      foreignKey: "questionId",
      onDelete: "CASCADE", // Cascade delete questions when a quiz is deleted
      onUpdate: "CASCADE",
    });
  };
  return Question;
};
