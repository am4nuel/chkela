module.exports = (sequelize, dataTypes) => {
  const PlainNote = sequelize.define("PlainNote", {
    title: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    grade: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    courseId: {
      type: dataTypes.INTEGER,
      allowNull: false,
    },
    chapter: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: dataTypes.TEXT("medium"), // Changed to TEXT for variable size
      allowNull: false,
    },
     curriculum: {
      type: dataTypes.STRING,
      defaultValue: 'new',
    },
  });
  return PlainNote;
};
