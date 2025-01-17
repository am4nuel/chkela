module.exports = (sequelize, dataTypes) => {
  const FlashCard = sequelize.define("FlashCard", {
    backContent: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    frontContent: {
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
      allowNull: true,
    },
    imagePath: {
      type: dataTypes.STRING,
      allowNull: true,
    },
    grade: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: dataTypes.STRING,
      allowNull: true,
    },
    mode: {
      type: dataTypes.STRING,
      allowNull: false,
    },
  });
  return FlashCard;
};
