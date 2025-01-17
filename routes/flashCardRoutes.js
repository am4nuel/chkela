const express = require("express");

const multer = require("multer");
const path = require("path");
const { FlashCard } = require("../models"); // Assuming models are in a models folder
const router = express.Router();
const cors = require("cors");
router.use(express.json());
router.use(cors());
router.use(express.urlencoded({ extended: true }));

// Set up storage engine for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/flashcard/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Serve static files from the "uploads" directory
router.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route to handle flashcard submissions
router.post("/submit-flashcards", upload.array("images"), async (req, res) => {
  try {
    const cards = req.body.cards ? JSON.parse(req.body.cards) : [];

    const savedCards = await Promise.all(
      cards.map(async (card, index) => {
        const imagePath =
          card.mode === "image" && req.files[index]
            ? `/uploads/flashcard/${req.files[index].filename}`
            : null;

        const savedCard = await FlashCard.create({
          frontContent: card.frontContent,
          backContent: card.backContent,
          category: card.category,
          course: card.course,
          color: card.color,
          chapter: card.chapter,
          imagePath: imagePath,
          grade: card.grade,
          mode: card.mode,
        });

        return savedCard;
      })
    );

    res
      .status(201)
      .json({ message: "Flashcards saved successfully", savedCards });
  } catch (error) {
    console.error("Error saving flashcards:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
router.get("/flashcards", async (req, res) => {
  try {
    const { grade, course, stream, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {
      grade: grade || "9", // Default grade to 9 if not provided
    };

    if (course) whereClause.course = course;
    if (grade && grade !== "9" && grade !== "10" && stream) {
      whereClause.category = stream;
    }

    const { rows: flashcards, count: totalFlashcards } =
      await FlashCard.findAndCountAll({
        where: whereClause,
        offset: parseInt(offset),
        limit: parseInt(limit),
      });

    res.status(200).json({
      flashcards,
      totalFlashcards,
      totalPages: Math.ceil(totalFlashcards / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ message: "Error fetching flashcards", error });
  }
});
router.post("/update-flashcard", upload.single("image"), async (req, res) => {
  try {
    // Extract the flashcard data from the request body
    const card = req.body.card ? JSON.parse(req.body.card) : null;

    if (!card || !card.id) {
      return res
        .status(400)
        .json({ message: "Flashcard ID is required for update." });
    }

    // Find the existing flashcard in the database
    const existingCard = await FlashCard.findByPk(card.id);

    if (!existingCard) {
      return res.status(404).json({ message: "Flashcard not found." });
    }

    // Handle the image update
    let imagePath = existingCard.imagePath;
    if (card.mode === "image" && req.file) {
      imagePath = `/uploads/flashcard/${req.file.filename}`;
    } else if (card.mode !== "image") {
      imagePath = null; // Remove the image if mode is not image
    }

    // Update the flashcard in the database
    existingCard.frontContent = card.frontContent;
    existingCard.backContent = card.backContent;
    existingCard.category = card.category;
    existingCard.course = card.course;
    existingCard.color = card.color;
    existingCard.chapter = card.chapter;
    existingCard.imagePath = imagePath;
    existingCard.grade = card.grade;
    existingCard.mode = card.mode;

    // Save the changes
    await existingCard.save();

    res.status(200).json({
      message: "Flashcard updated successfully",
      updatedCard: existingCard,
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ message: "An error occurred", error });
  }
});
router.get("/all-flashcards", async (req, res) => {
  try {
    // const { grade, category } = req.query;
    // console.log(grade, category, "flash cards");
    // const whereClause = {};

    // if (grade) whereClause.grade = grade;
    // if (category) whereClause.category = category;
    // if (parseInt(grade) == 12) {
    //   const flashcards = await FlashCard.findAll({ where: { category } });
    //   res.status(200).json(flashcards);
    // } else {
    const flashcards = await FlashCard.findAll();

    res.status(200).json(flashcards);
    // }
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ message: "Error fetching flashcards", error });
  }
});

module.exports = router;
