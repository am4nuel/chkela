const express = require("express");
const { PlainNote } = require("../models"); // Adjust the path as needed
const { Op, where } = require("sequelize");
const router = express.Router();

// Route to handle the form submission for creating a new plain note
router.post("/create", async (req, res) => {
  const { title, chapter, content, grade, category, courseId, id } = req.body;

  // Log the request body
  console.log(req.body);

  // Basic validation
  if (!title || !chapter || !content || !grade || !category || !courseId) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    if (id) {
      // Update the existing note if `id` is provided
      const [updated] = await PlainNote.update(
        { title, chapter, content, grade, category, courseId },
        { where: { id } }
      );

      if (updated) {
        const updatedNote = await PlainNote.findOne({ where: { id } });
        return res.status(200).json(updatedNote);
      }

      return res.status(404).json({ error: "Note not found." });
    } else {
      // Create a new note if `id` is not provided
      const newNote = await PlainNote.create({
        title,
        chapter,
        content,
        grade,
        category,
        courseId,
      });
      return res.status(201).json(newNote);
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/plain-notes", async (req, res) => {
  const {
    id,
    page = 1,
    size = 10,
    search = "",
    grade,
    course,
    stream,
  } = req.query;

  try {
    if (id) {
      // Fetch a single note by ID
      const note = await PlainNote.findByPk(id);
      if (note) {
        return res.json(note);
      } else {
        return res.status(404).json({ message: "Note not found" });
      }
    }

    // Calculate pagination offsets
    const limit = parseInt(size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    // Fetch notes with pagination and search functionality
    const { count, rows } = await PlainNote.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { grade: { [Op.like]: `%${grade}%` } },
          { courseId: { [Op.like]: `%${course}%` } },
          { category: { [Op.like]: `%${stream}%` } },
        ],
      },
      limit,
      offset,
    });

    res.json({
      notes: rows,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
    });
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.status(500).json({ message: "Error retrieving notes" });
  }
});
router.get("/plain-notes-list", async (req, res) => {
  try {
    const notes = await PlainNote.findAll({
      attributes: { exclude: ["content"] }, // Exclude content column
    });

    res.json(notes);
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.status(500).json({ message: "Error retrieving notes" });
  }
});

module.exports = router;
