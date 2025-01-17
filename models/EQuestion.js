"use strict";
module.exports = (sequelize, DataTypes) => {
  const EQuestion = sequelize.define(
    "EQuestion",
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      examId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Exams",
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
      explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      explanationImage: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
    },
    {}
  );
  EQuestion.associate = function (models) {
    EQuestion.belongsTo(models.Exam, {
      foreignKey: "examId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    EQuestion.hasMany(models.EChoice, {
      foreignKey: "questionId",
      onDelete: "CASCADE", // Cascade delete questions when a quiz is deleted
      onUpdate: "CASCADE",
    });
  };
  return EQuestion;
};
