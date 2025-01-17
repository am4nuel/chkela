module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define("Course", {
    courseName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  // Define associations
  Course.associate = (models) => {
    Course.hasMany(models.Chapter, {
      foreignKey: "courseId",
      as: "chapters",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Course;
};
