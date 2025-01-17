module.exports = (sequelize, dataTypes) => {
  const Report = sequelize.define("Report", {
    postId: {
      type: dataTypes.STRING,
      allowNull: false,
    },
    reportReason: {
      type: dataTypes.STRING,
      allowNull: false,
    },
  });
  return Report;
};
