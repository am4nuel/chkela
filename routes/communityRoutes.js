const express = require("express");
const multer = require("multer");
const path = require("path");
const { Community, FollowCommunity, User } = require("../models");
const { Op } = require("sequelize");
const cors = require("cors");

const router = express.Router();
router.use(cors());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/communityimages"); // Set your upload directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to the filename
  },
});

const upload = multer({ storage: storage });

router.post(
  "/createCommunity",
  upload.fields([{ name: "profileImage" }, { name: "bannerImage" }]),
  async (req, res) => {
    try {
      const { name, description, category, userName, ownerId } = req.body;
      console.log("accessed");
      const community = await Community.create({
        name,
        description,
        category,
        userName,
        ownerId,
        profileImagePath: req.files.profileImage
          ? req.files.profileImage[0].path
          : null,
        bannerImagePath: req.files.bannerImage
          ? req.files.bannerImage[0].path
          : null,
      });

      res.status(200).json(community);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create community" });
    }
  }
);
router.get("/getCommunity", async (req, res) => {
  const { communityId, ownerId, page = 1, limit = 1000 } = req.query;

  try {
    if (communityId) {
      console.log("accessed by id");
      // Fetch a specific community by its ID
      const community = await Community.findByPk(communityId);
      if (community) {
        res.status(200).json(community);
      } else {
        res.status(404).json({ error: "Community not found" });
      }
    } else if (ownerId) {
      // Fetch all communities for a specific owner
      const communities = await Community.findAll({ where: { ownerId } });
      console.log("accessed by owner id", communities);
      res.status(200).json({ communities });
    } else {
      // Fetch the top communities with pagination
      console.log("accessed");
      const communities = await Community.findAndCountAll({
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [["createdAt", "DESC"]], // Example sorting by creation date
      });
      res.status(200).json({
        total: communities.count,
        communities: communities.rows,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve communities" });
  }
});
router.get("/search-communities", async (req, res) => {
  try {
    const query = req.query.query || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Convert query to lowercase for case-insensitive search
    const lowerCaseQuery = query.toLowerCase();

    // Search for communities by name or description
    const { rows: communities, count: totalCommunities } =
      await Community.findAndCountAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${lowerCaseQuery}%` } }, // case-insensitive search
            { description: { [Op.like]: `%${lowerCaseQuery}%` } },
          ],
        },
        offset,
        limit,
        order: [["createdAt", "DESC"]], // Sort by creation date in descending order
      });

    const totalPages = Math.ceil(totalCommunities / limit);

    res.json({
      communities,
      totalPages,
      currentPage: page,
      totalCommunities,
    });
  } catch (error) {
    console.error("Error searching communities:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/communities/:communityId/followers", async (req, res) => {
  try {
    const { communityId } = req.params;

    // Find users following the specified community
    const followerTrackers = await FollowCommunity.findAll({
      where: { followed: communityId },
      include: [
        {
          model: User,
          as: "FollowerUser",
           required: true,
        },
      ],
    });

    // Extract and return the list of followers
    const followers = followerTrackers.map((tracker) => tracker.FollowerUser);

    if (followers.length === 0) {
      return res
        .status(404)
        .json({ message: "No followers found for this community." });
    }

    res.status(200).json(followers);
  } catch (error) {
    console.error("Error fetching community followers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
