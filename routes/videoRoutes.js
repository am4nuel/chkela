const express = require("express");
const router = express.Router();
const { Video } = require("../models"); // Make sure this path points to where your models are defined
const cors = require("cors");
const { Op, where } = require("sequelize");
// Route to create a new video entry
router.use(express.json());
router.use(cors());
router.post("/createVideo", async (req, res) => {
  const { title, grade, category, course, chapter, link } = req.body;

  try {
    // Validation
    if (!title || !grade || !category || !course || !chapter || !link) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the video entry
    const newVideo = await Video.create({
      title,
      grade,
      category,
      course,
      chapter,
      link,
    });

    // Respond with the created video
    return res.status(201).json(newVideo);
  } catch (error) {
    console.error("Error creating video:", error);
    return res.status(500).json({ message: "Error creating video" });
  }
});
router.get("/videos", async (req, res) => {
  const { page = 1, size = 10, search = "", grade, stream, course } = req.query;
  console.log("accessed");
  try {
    const whereClause = {
      title: { [Op.like]: `%${search}%` },
      ...(grade && { grade }),
      ...(stream && { category: stream }),
      ...(course && { course }),
    };

    const videos = await Video.findAndCountAll({
      where: whereClause,
      limit: parseInt(size),
      offset: (page - 1) * size,
    });

    const totalPages = Math.ceil(videos.count / size);

    res.json({
      videos: videos.rows,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).send("Server error");
  }
});
router.post("/updateVideo", async (req, res) => {
  const { title, grade, id, category, course, chapter, link } = req.body;

  try {
    // Find the video by ID
    const video = await Video.findByPk(id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Update video details
    await video.update({
      title,
      grade,
      category,
      course,
      chapter,
      link,
    });

    // Send a success response
    res.status(200).json({
      message: "Video updated successfully!",
      data: video,
    });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ message: "Error updating video" });
  }
});
router.get("/all-videos", async (req, res) => {
  //const { grade, category } = req.query;

  try {
    // // Build base where clause
    // const whereClause = {
    //   category: {
    //     [Op.or]: [category, "Both"], // Match provided category or "Both"
    //   },
    // };

    // // Adjust where clause for grade 12
    // if (grade.toString() === "12") {
    //   whereClause.category = { [Op.or]: [category, "Both"] };
    // }

    const videos = await Video.findAll({ where: { course: 17 } });
    res.json({
      videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).send("Server error");
  }
});

module.exports = router;
