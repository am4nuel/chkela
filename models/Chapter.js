module.exports = (sequelize, DataTypes) => {
  const Chapter = sequelize.define("Chapter", {
    chapter: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chapterTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Courses", // name of the table, not the model
        key: "id",
      },
    },
  });

  // Define associations
  Chapter.associate = (models) => {
    Chapter.belongsTo(models.Course, {
      foreignKey: "courseId",
      as: "course",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Chapter;
};
