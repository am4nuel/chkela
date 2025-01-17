"use strict";
module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define("Referral", {
    referred: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users", // Reference the correct model (ensure Users is pluralized correctly)
        key: "id",
      },
    },
    referredBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
  });

  Referral.associate = function (models) {
    // A referral belongs to the user who was referred
    Referral.belongsTo(models.User, {
      foreignKey: "referred",
      as: "ReferredUser", // Alias to distinguish relation
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // A referral also belongs to the user who referred
    Referral.belongsTo(models.User, {
      foreignKey: "referredBy",
      as: "ReferredByUser", // Alias to distinguish relation
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  };

  return Referral;
};
