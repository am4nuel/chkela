const express = require("express");
const router = express.Router();
const { Course, Chapter } = require("../models");
const cors = require("cors");
const { Op } = require("sequelize");
router.use(cors());
router.use(express.json());
// Route to get courses based on grade and category

router.get("/courses", async (req, res) => {
  try {
    const { grade, category, id, mode } = req.query;

    // Ensure grade is a valid integer
    const parsedGrade = parseInt(grade);

    let whereClause = {};

    // Validate and assign grade
    if (!isNaN(parsedGrade)) {
      whereClause.grade = parsedGrade;
    } else {
      throw new Error("Invalid grade provided");
    }

    // Add category if grade is >= 11 and category is defined
    if (parsedGrade >= 11 && category) {
      whereClause.category = category;
    }

    // Handle specific case for grade 12
    if (parsedGrade === 12) {
      if (mode) {
        console.log("with mode", grade, category, mode, whereClause);
        const courses = await Course.findAll({
          where: {grade,
            category: { [Op.in]: [category, "Both"] }, // Ensure category and 'Both' are valid
          },
          include: [
            {
              model: Chapter,
              as: "chapters",
            },
          ],
        });

        res.json(courses);
      } else {
        // Handle case where mode is not provided, check for 'category' or 'Both'
        const courses = await Course.findAll({
          where: {
            category: {
              [Op.in]: [category, "Both"], // Ensure category and 'Both' are valid
            },
          },
          include: [
            {
              model: Chapter,
              as: "chapters",
            },
          ],
        });
        console.log("course length", courses.length);
        res.json(courses);
      }
    } else {
      // Handle other cases
      console.log("with why??", grade, category, mode, whereClause);
      const courses = await Course.findAll({
        where: whereClause, // Use the constructed whereClause
        include: [
          {
            model: Chapter,
            as: "chapters",
          },
        ],
      });
      res.json(courses);
    }
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Route to insert a new course
router.post("/courses", async (req, res) => {
  try {
    const { courseName, grade, category, chapters } = req.body;

    // Create the course
    const newCourse = await Course.create({
      courseName,
      grade,
      category,
    });

    // If chapters are provided, create them for the course
    if (chapters && chapters.length > 0) {
      const chapterPromises = chapters.map((chapter) =>
        Chapter.create({
          chapter: chapter.chapter,
          chapterTitle: chapter.chapterTitle,
          courseId: newCourse.id,
        })
      );

      await Promise.all(chapterPromises);
    }

    res.json(newCourse);
  } catch (error) {
    console.error("Error inserting course:", error);
    res.status(500).json({ error: "Failed to insert course" });
  }
});

// Route to update an existing course
router.put("/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, grade, category, chapters } = req.body;

    // Find the course by ID and include chapters using the alias
    const course = await Course.findByPk(id, {
      include: [
        {
          model: Chapter,
          as: "chapters", // Use the alias defined in the association
        },
      ],
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Update course details
    course.courseName = courseName;
    course.grade = grade;
    course.category = category;

    // Update chapters
    if (chapters && Array.isArray(chapters)) {
      await Promise.all(
        chapters.map(async (chapter) => {
          if (chapter.id) {
            // If chapter has an ID, update the existing chapter
            await Chapter.update(
              {
                chapter: chapter.chapter,
                chapterTitle: chapter.chapterTitle,
              },
              { where: { id: chapter.id, courseId: course.id } }
            );
          } else {
            // If chapter does not have an ID, create a new chapter
            await Chapter.create({
              chapter: chapter.chapter,
              chapterTitle: chapter.chapterTitle,
              courseId: course.id,
            });
          }
        })
      );
    }

    await course.save();

    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// Route to delete a course
router.delete("/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    await course.destroy();

    res.status(204).end(); // No content to send back
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});
router.get("/chapters/:courseId", async (req, res) => {
  const { courseId } = req.params;

  try {
    // Fetch the course from the database
    const chapters = await Chapter.findAll({ where: { courseId: courseId } });

    if (!chapters) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log(chapters);
    res.json(chapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
