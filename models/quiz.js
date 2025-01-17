"use strict";
module.exports = (sequelize, DataTypes) => {
  const Quiz = sequelize.define(
    "Quiz",
    {
      mode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      quizTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      scheduleDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      scheduleTime: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      grade: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {}
  );
  Quiz.associate = function (models) {
    // associations can be defined here
    Quiz.hasMany(models.Question, {
      foreignKey: "quizId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };
  return Quiz;
};
