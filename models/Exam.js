"use strict";
module.exports = (sequelize, DataTypes) => {
  const Exam = sequelize.define(
    "Exam",
    {
      mode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      examTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      year: {
        type: DataTypes.STRING,
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
      examHour: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      examMinute: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      curriculum: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      galaxyMode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {}
  );
  Exam.associate = function (models) {
    // associations can be defined here
    Exam.hasMany(models.EQuestion, {
      foreignKey: "examId",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };
  return Exam;
};
