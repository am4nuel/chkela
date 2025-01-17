module.exports = (sequelize, dataTypes) => {
  const Video = sequelize.define("Video", {
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
    link: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    curriculum: {
      type: dataTypes.STRING,
      defaultValue: "new",
    },
    type: {
      type: dataTypes.STRING,
      defaultValue: "chkela",
    },
  });
  return Video;
};
