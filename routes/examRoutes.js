const express = require("express");
const router = express.Router();
const cors = require("cors");
const { Exam, EQuestion, EChoice, Course, sequelize } = require("../models");
const { Op, where, json } = require("sequelize");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { stringify } = require("querystring");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/examimages/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use original file name
  },
});
const upload = multer({ storage: storage });
router.use(cors());
router.use(express.json());
// Route to create a new quiz with questions and choices
router.post("/create-exam", upload.any(), async (req, res) => {
  const {
    category,
    grade,
    courseId,
    mode,
    year,
    questions,
    examTitle,
    examHour,
    examMinute,
    curriculum,
    allMode,
  } = req.body || {};
  const files = req.files;
  const transaction = await sequelize.transaction();
  console.log(
    category,
    grade,
    courseId,
    mode,
    year,
    questions,
    examTitle,
    examHour,
    examMinute,
    curriculum,
    allMode
  );
  try {
    console.log("Creating quiz with data:", {
      mode,
      year,
      grade,
      examTitle,
      category,
      courseId,
      curriculum,
      allMode,
    });

    const exam = await Exam.create(
      {
        mode,
        year,
        grade,
        examTitle,
        category,
        courseId,
        examHour,
        examMinute,
        curriculum,
        galaxyMode: allMode,
      },
      { transaction }
    );

    const parsedQuestions = JSON.parse(questions);

    // Use Promise.all to handle asynchronous operations
    await Promise.all(
      parsedQuestions.map(async (question) => {
        if (question.choices.filter((c) => c.isCorrect).length === 0) {
          throw new Error(
            "Each question must have at least one correct choice."
          );
        }

        // Find the file corresponding to the current question
        const file = files.find(
          (file) =>
            file.fieldname ===
            parsedQuestions
              .findIndex(
                (item) => item.id.toString() === question.id.toString()
              )
              .toString()
        );

        if (file) {
          // File is found; process it
          const fileName = path.basename(file.originalname);
          const sanitizedFileName = fileName.replace(/^\d+-/, "");
          const newFilePath = path.join(
            "uploads/examimages",
            sanitizedFileName
          );

          await new Promise((resolve, reject) => {
            fs.rename(file.path, newFilePath, (err) => {
              if (err) {
                reject(
                  `Error uploading file for question ${question.id}: ${err}`
                );
              } else {
                resolve();
              }
            });
          });

          const newQuestion = await EQuestion.create(
            {
              content: question.question,
              examId: exam.id,
              chapter: question.chapter || null,
              hasImage: newFilePath, // Save image filename if it exists
              hasContentToread: question.text || null,
              explanation: question.explanation,
            },
            { transaction }
          );

          await Promise.all(
            question.choices.map((choice) =>
              EChoice.create(
                {
                  content: choice.text,
                  isCorrect: choice.isCorrect,
                  questionId: newQuestion.id,
                },
                { transaction }
              )
            )
          );
          console.log("Question created with image:", newQuestion.id);
        } else {
          // No file is found; create the question with null image field
          console.log("Creating question without an image:", question.question);
          const newQuestion = await EQuestion.create(
            {
              content: question.question,
              examId: exam.id,
              chapter: question.chapter || null,
              hasImage: null, // No image associated with this question
              hasContentToread: question.text || null,
              explanation: question.explanation,
            },
            { transaction }
          );

          await Promise.all(
            question.choices.map((choice) =>
              EChoice.create(
                {
                  content: choice.text,
                  isCorrect: choice.isCorrect,
                  questionId: newQuestion.id,
                },
                { transaction }
              )
            )
          );
          console.log("Question created:", newQuestion.id);
        }
      })
    );

    await transaction.commit();
    res.status(201).json({ message: "Quiz created successfully", exam });
  } catch (error) {
    console.error("Transaction error:", error.message);
    await transaction.rollback();
    res.status(500).json({
      error: "An error occurred while creating the quiz",
      details: error.message,
    });
  }
});
// Backend Route
router.get("/exams", async (req, res) => {
  try {
    const { id, page = 1, limit = 8 } = req.query;
    let course;

    if (id) {
      // Fetch a single exam by ID with associated questions and choices
      const exam = await Exam.findOne({
        where: { id: id },
        include: {
          model: EQuestion,
          include: {
            model: EChoice,
          },
        },
      });

      if (!exam) {
        return res.status(404).json({ error: "Exam not found" });
      }
      course = await Course.findOne({ where: { id: exam.courseId } });

      return res.json(exam);
    } else {
      // Default pagination logic if no ID is provided
      const offset = (page - 1) * limit;

      const exams = await Exam.findAndCountAll({
        offset: parseInt(offset),
        limit: parseInt(limit),
        include: {
          model: EQuestion,
          include: {
            model: EChoice,
          },
        },
      });
      const courses = await Promise.all(
        exams.rows.map((element) =>
          Course.findOne({ where: { id: element.courseId } })
        )
      );

      return res.json({
        totalPages: Math.ceil(exams.count / limit),
        currentPage: parseInt(page),
        data: exams.rows,
        course: courses,
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching exams." });
  }
});

router.get("/stud-exams", async (req, res) => {
  try {
    // const { grade, category } = req.query;
    // console.log(grade, category);

    const exams = await Exam.findAll({
      include: {
        model: EQuestion,
        include: {
          model: EChoice,
        },
      },
    });

    // if (parseInt(grade) === 12) {
    //   // Grade 12 - no grade filter, only category
    //   console.log("Grade 12");
    //   exams = await Exam.findAll({
    //     where: {
    //       category: { [Op.in]: [category, "Both"] },
    //     },
    //     include: {
    //       model: EQuestion,
    //       include: {
    //         model: EChoice,
    //       },
    //     },
    //   });
    // } else if (parseInt(grade) === 11) {
    //   // Grade 11 - use both grade and category
    //   console.log("Grade 11");
    //   exams = await Exam.findAll({
    //     where: {
    //       grade,
    //       category: { [Op.in]: [category, "Both"] },
    //     },
    //     include: {
    //       model: EQuestion,
    //       include: {
    //         model: EChoice,
    //       },
    //     },
    //   });
    // } else if (parseInt(grade) === 9 || parseInt(grade) === 10) {
    //   // Grades 9 and 10 - filter by grade only
    //   console.log("Grades 9 and 10");
    //   exams = await Exam.findAll({
    //     where: { grade },
    //     include: {
    //       model: EQuestion,
    //       include: {
    //         model: EChoice,
    //       },
    //     },
    //   });
    // }
    // console.log(exams.length);
    res.status(200).json({ exams });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching exams." });
  }
});
router.get("/spec-exams", async (req, res) => {
  try {
    const { courseId, mode } = req.query;

    if (!courseId) {
      return res
        .status(400)
        .json({ error: "courseId query parameter is required." });
    }

    const exams = await Exam.findAll({
      where: { courseId, mode },
      include: [
        {
          model: EQuestion,
          include: [
            {
              model: EChoice,
            },
          ],
        },
      ],
    });

    res.status(200).json({ exams });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching exams." });
  }
});

router.post("/examUpdate", upload.any(), async (req, res) => {
  const {
    id, // Quiz ID
    category,
    grade,
    courseId,
    mode,
    year,
    examTitle,
    examHour,
    examMinute,
    questions: questionsStr, // Array of questions as a JSON string
  } = req.body;

  const files = req.files || []; // Ensure req.files is an array
  const imageFolderPath = path.join(__dirname, "uploads/examimages");
  const transaction = await sequelize.transaction();

  try {
    // Ensure the image folder exists
    if (!fs.existsSync(imageFolderPath)) {
      fs.mkdirSync(imageFolderPath, { recursive: true });
    }

    // Parse questions JSON string
    const questions = JSON.parse(questionsStr);

    // Find the quiz by ID
    const exam = await Exam.findOne({ where: { id } });

    if (!exam) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Update quiz details
    await Exam.update(
      {
        category,
        grade,
        courseId,
        mode,
        examTitle,
        year,
        examHour,
        examMinute,
      },
      { where: { id }, transaction }
    );

    // Process questions
    await Promise.all(
      questions.map(async (question) => {
        let questionInstance;

        if (question.id) {
          // Update existing question
          questionInstance = await EQuestion.findOne({
            where: { id: question.id, examId: exam.id },
            transaction,
          });

          if (questionInstance) {
            await questionInstance.update(
              {
                content: question.content,
                explanation: question.explanation,
                chapter: question.chapter || null,
                hasContentToread: question.text || null,
              },
              { transaction }
            );
          } else {
            // If question ID was provided but not found, create a new one
            questionInstance = await EQuestion.create(
              {
                content: question.content,
                explanation: question.explanation,
                examId: exam.id,
                chapter: question.chapter || null,
                hasContentToread: question.text || null,
              },
              { transaction }
            );
          }
        } else {
          // Create a new question if no ID is provided
          questionInstance = await EQuestion.create(
            {
              content: question.content,
              explanation: question.explanation,
              examId: exam.id,
              chapter: question.chapter || null,
              hasContentToread: question.text || null,
            },
            { transaction }
          );
        }

        // Handle file upload for question
        const fileIndex = questions.findIndex(
          (item) => item.id?.toString() === question.id?.toString()
        );

        if (fileIndex >= 0) {
          const file = files.find(
            (file) =>
              file.fieldname ===
              questions
                .findIndex(
                  (item) => item.id.toString() === question.id.toString()
                )
                .toString()
          );

          if (file) {
            const fileName = path.basename(file.originalname);
            const sanitizedFileName = fileName.replace(/^\d+-/, "");
            const newFilePath = path.join(imageFolderPath, sanitizedFileName);

            // Check if file already exists
            if (fs.existsSync(newFilePath)) {
              // If file exists, update the database with the existing file path
              await questionInstance.update(
                { hasImage: "uploads\\examimages\\" + sanitizedFileName },
                { transaction }
              );
            } else {
              // If file does not exist, move the uploaded file and update the database
              if (fs.existsSync(file.path)) {
                await new Promise((resolve, reject) => {
                  fs.rename(file.path, newFilePath, (err) => {
                    if (err) {
                      reject(
                        `Error uploading file for question ${question.id}: ${err}`
                      );
                    } else {
                      resolve();
                    }
                  });
                });

                // Update question with the new image path
                await questionInstance.update(
                  { hasImage: "uploads\\examimages\\" + sanitizedFileName },
                  { transaction }
                );
              } else {
                throw new Error(`File not found at ${file.path}`);
              }
            }
          }
        }

        // Handle choices for the current question
        const choiceIds = [];

        await Promise.all(
          question.EChoices.map(async (choice) => {
            let choiceInstance;

            if (choice.id) {
              // Update existing choice
              choiceInstance = await EChoice.findOne({
                where: { id: choice.id, questionId: questionInstance.id },
                transaction,
              });

              if (choiceInstance) {
                await choiceInstance.update(
                  {
                    content: choice.content,
                    isCorrect: choice.isCorrect,
                  },
                  { transaction }
                );
              } else {
                // If choice ID was provided but not found, create a new one
                choiceInstance = await EChoice.create(
                  {
                    content: choice.content,
                    isCorrect: choice.isCorrect,
                    questionId: questionInstance.id,
                  },
                  { transaction }
                );
              }
            } else {
              // Create a new choice if no ID is provided
              choiceInstance = await EChoice.create(
                {
                  content: choice.content,
                  isCorrect: choice.isCorrect,
                  questionId: questionInstance.id,
                },
                { transaction }
              );
            }

            choiceIds.push(choiceInstance.id);
          })
        );

        // Remove existing choices that are not in the updated list
        await EChoice.destroy({
          where: {
            questionId: questionInstance.id,
            id: { [Op.notIn]: choiceIds },
          },
          transaction,
        });
      })
    );

    await transaction.commit();
    res.json({ message: "Quiz updated successfully" });
  } catch (error) {
    console.error("Error updating quiz:", error);
    await transaction.rollback();
    res.status(500).json({
      error: "An error occurred while updating the quiz",
      details: error.message,
    });
  }
});

router.delete("/:tableName/:id", async (req, res) => {
  const { tableName, id } = req.params;

  try {
    let result;

    if (tableName === "quiz") {
      result = await Exam.destroy({ where: { id } });
    } else if (tableName === "question") {
      result = await EQuestion.destroy({ where: { id } });
    } else if (tableName === "choice") {
      result = await EChoice.destroy({ where: { id } });
    } else {
      return res.status(400).json({ error: "Invalid table name provided." });
    }

    if (result === 0) {
      return res
        .status(404)
        .json({ error: `${tableName} with id ${id} not found.` });
    }

    res
      .status(200)
      .json({ message: `${tableName} with id ${id} has been deleted.` });
  } catch (error) {
    res.status(500).json({
      error: "An error occurred while deleting the record.",
      details: error.message,
    });
  }
});

module.exports = router;
