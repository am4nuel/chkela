module.exports = (sequelize, dataTypes) => {
  const Note = sequelize.define("Note", {
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
    course: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    chapter: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    filepath: {
      type: dataTypes.STRING,
      allowNull: false,
    },
     curriculum: {
      type: dataTypes.STRING,
      defaultValue: 'new',
    },
  });
  return Note;
};
