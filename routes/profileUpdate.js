const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { User, Community } = require("../models"); // Adjust the path as needed

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profiles"); // Define the upload folder
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Define the route
router.post(
  "/update-profile/:id/:type",
  upload.fields([{ name: "profileImage" }, { name: "bannerImage" }]),
  async (req, res) => {
    const { id, type } = req.params;
    const { name, description } = req.body;
    const profileImage = req.files["profileImage"]
      ? req.files["profileImage"][0].filename
      : null;
    const bannerImage = req.files["bannerImage"]
      ? req.files["bannerImage"][0].filename
      : null;
    console.log("accessed ooo");
    try {
      // Update the profile or community based on the type
      if (type === "user") {
        const updateData = { name };
        if (description) updateData.description = description;
        if (profileImage)
          updateData.profileImage = `/uploads/profiles/${profileImage}`;

        await User.update({ fullName: updateData.name }, { where: { id } });
        console.log("updated", updateData, id);
      } else if (type === "community") {
        const updateData = { name };
        if (description) updateData.description = description;
        if (profileImage)
          updateData.profileImage = `/uploads/profiles/${profileImage}`;
        if (bannerImage)
          updateData.bannerImage = `/uploads/profiles/${bannerImage}`;

        await Community.update(updateData, { where: { id } });
      } else {
        return res.status(400).send("Invalid type");
      }

      res.status(200).send("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).send("Error updating profile");
    }
  }
);

module.exports = router;
