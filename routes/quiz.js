const express = require("express");
const router = express.Router();
const cors = require("cors");
const {
  Quiz,
  Question,
  Choice,
  QuizRank,
  Course,
  User,
  sequelize,
} = require("../models");
const { Op, where } = require("sequelize");
router.use(cors());
router.use(express.json());
// const calculateCountdown = (scheduledDate, scheduledTime) => {
//   if (!scheduledDate || !scheduledTime) {
//     return "No schedule";
//   }

//   const formattedDate = scheduledDate.toISOString().split("T")[0]; // Format date
//   const dateTimeString = `${formattedDate}T${scheduledTime}`;

//   const countdownDateTime = new Date(dateTimeString);

//   if (isNaN(countdownDateTime.getTime())) {
//     return "Invalid date";
//   }

//   const now = new Date();

//   if (countdownDateTime <= now) {
//     return "Started";
//   }

//   const timeRemaining = countdownDateTime - now;

//   const hours = Math.floor(
//     (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
//   );
//   const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
//   const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

//   return `${hours}h ${minutes}m ${seconds}s`;
// };

// // Route to fetch quizzes and log countdowns
// router.get("/log-countdowns", async (req, res) => {
//   try {
//     const quizzes = await Quiz.findAll({
//       where: {
//         mode: "scheduled",
//         scheduleDate: {
//           [Op.gte]: new Date(), // Only future quizzes
//         },
//       },
//     });

//     quizzes.forEach((quiz) => {
//       const countdown = calculateCountdown(
//         quiz.scheduleDate,
//         quiz.scheduleTime
//       );
//       console.log(`Quiz: ${quiz.quizTitle}, Countdown: ${countdown}`);
//     });

//     res.send("Countdowns logged to the console.");
//   } catch (error) {
//     console.error("Error fetching quizzes:", error);
//     res.status(500).send("Error fetching quizzes.");
//   }
// });

router.post("/create-quiz", async (req, res) => {
  const {
    category,
    grade,
    courseId,
    mode,
    scheduleDate,
    scheduleTime,
    questions,
    quizTitle,
  } = req.body || {};

  const transaction = await sequelize.transaction();
  const formattedScheduleDate = new Date(
    `${scheduleDate.split(" ")[0]}T${scheduleTime}`
  ).toISOString();
  try {
    console.log("Creating quiz with data:", {
      mode,
      scheduleDate,
      scheduleTime,
      grade,
      quizTitle,
      category,
      courseId,
    });

    const quiz = await Quiz.create(
      {
        mode,
        scheduleDate: formattedScheduleDate || null,
        scheduleTime: scheduleTime || null,
        grade,
        quizTitle,
        category,
        courseId,
      },
      { transaction }
    );

    console.log("Quiz created:", quiz.id);

    for (const question of questions) {
      if (question.choices.filter((c) => c.isCorrect).length === 0) {
        throw new Error("Each question must have at least one correct choice.");
      }

      console.log("Creating question:", question.question);
      const newQuestion = await Question.create(
        { content: question.question, quizId: quiz.id },
        { transaction }
      );

      console.log("Question created:", newQuestion.id);

      for (const choice of question.choices) {
        console.log("Creating choice:", choice.text);
        await Choice.create(
          {
            content: choice.text,
            isCorrect: choice.isCorrect,
            questionId: newQuestion.id,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();
    res.status(201).json({ message: "Quiz created successfully", quiz });
  } catch (error) {
    console.error("Transaction error:", error.message);
    await transaction.rollback();
    res.status(500).json({
      error: "An error occurred while creating the quiz",
      details: error.message,
    });
  }
});
router.get("/quizzes", async (req, res) => {
  try {
    const { id, page = 1, limit = 8 } = req.query;
    var course;
    //fetch every course data if id is not provided
    if (id) {
      // Fetch a single quiz by ID with associated questions and choices
      const quiz = await Quiz.findOne({
        where: { id: id },
        include: {
          model: Question,
          include: {
            model: Choice,
          },
        },
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      course = await Course.findOne({ where: { id: quiz.id } });

      return res.json(quiz);
    } else {
      // Default pagination logic if no ID is provided
      const offset = (page - 1) * limit;

      const quizzes = await Quiz.findAndCountAll({
        offset: parseInt(offset),
        limit: parseInt(limit),
      });
      const courses = await Promise.all(
        quizzes.rows.map((element) =>
          Course.findOne({ where: { id: element.courseId } })
        )
      );

      return res.json({
        totalPages: Math.ceil(quizzes.count / limit),
        currentPage: parseInt(page),
        data: quizzes.rows,
        course: courses,
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching quizzes." });
  }
});
router.get("/latest-scheduled-quiz", async (req, res) => {
  try {
    const now = new Date(); // Current date and time in UTC
    const nowDate = now.toISOString().split("T")[0]; // Current UTC Date (YYYY-MM-DD)
    const nowTime = now.toTimeString().split(" ")[0].substring(0, 5); // Current UTC Time (HH:MM)

    console.log("Current UTC DateTime:", now.toISOString());

    const latestScheduledQuiz = await Quiz.findOne({
      where: {
        mode: "scheduled", // Ensure the mode is 'scheduled'
        [Op.or]: [
          {
            scheduleDate: {
              [Op.gt]: nowDate, // Future dates
            },
          },
          {
            scheduleDate: nowDate, // Today
            scheduleTime: {
              [Op.gte]: nowTime, // Time later today in UTC
            },
          },
        ],
      },
      include: {
        model: Question,
        include: {
          model: Choice,
        },
      },
      order: [
        ["createdAt", "DESC"], // Get the most recently inserted quiz
        ["scheduleDate", "ASC"],
        ["scheduleTime", "ASC"],
      ],
    });

    if (!latestScheduledQuiz) {
      console.log("No quiz found.");
      return res
        .status(404)
        .json({ error: "No scheduled quiz found for the future." });
    }

    return res.json({
      latestScheduledQuiz,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "An error occurred while fetching the latest scheduled quiz.",
    });
  }
});

router.post("/quizUpdate", async (req, res) => {
  const {
    id, // Quiz ID
    category,
    grade,
    courseId,
    mode,
    scheduleDate,
    quizTitle,
    scheduleTime,
    questions, // Array of questions with choices
  } = req.body;

  try {
    // Find the quiz by ID
    const quiz = await Quiz.findOne({ where: { id } });

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    console.log("where is time", scheduleDate, scheduleTime);
    const formattedScheduleDate = new Date(
      `${scheduleDate.split("T")[0]}T${scheduleTime}`
    ).toISOString();
    await quiz.update({
      category,
      grade,
      courseId,
      mode,
      quizTitle,
      scheduleDate: formattedScheduleDate || null,
      scheduleTime: scheduleTime || null,
    });

    // Loop through each question
    for (const question of questions) {
      let questionInstance;

      // Check if the question already exists
      if (question.id) {
        questionInstance = await Question.findOne({
          where: { id: question.id, quizId: quiz.id },
        });

        if (questionInstance) {
          // Update the existing question content
          await questionInstance.update({ content: question.content });
        } else {
          // If the question ID was provided but not found, create a new one
          questionInstance = await Question.create({
            content: question.content,
            quizId: quiz.id,
          });
        }
      } else {
        // Create a new question if no ID is provided
        questionInstance = await Question.create({
          content: question.content,
          quizId: quiz.id,
        });
      }

      // Handle choices for the current question
      const choiceIds = [];

      for (const choice of question.choices) {
        let choiceInstance;

        if (choice.id) {
          // If choice ID exists, find and update the choice
          choiceInstance = await Choice.findOne({
            where: { id: choice.id, questionId: questionInstance.id },
          });

          if (choiceInstance) {
            await choiceInstance.update({
              content: choice.content,
              isCorrect: choice.isCorrect,
            });
          } else {
            // If the choice ID was provided but not found, create a new one
            choiceInstance = await Choice.create({
              content: choice.content,
              isCorrect: choice.isCorrect,
              questionId: questionInstance.id,
            });
          }
        } else {
          // Create a new choice if no ID is provided
          choiceInstance = await Choice.create({
            content: choice.content,
            isCorrect: choice.isCorrect,
            questionId: questionInstance.id,
          });
        }

        choiceIds.push(choiceInstance.id);
      }

      // Remove existing choices that are not in the updated list
      await Choice.destroy({
        where: {
          questionId: questionInstance.id,
          id: { [Op.notIn]: choiceIds },
        },
      });
    }

    res.json({ message: "Quiz updated successfully" });
  } catch (error) {
    console.error("Error updating quiz:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the quiz" });
  }
});

router.delete("/:tableName/:id", async (req, res) => {
  const { tableName, id } = req.params;

  try {
    let result;

    if (tableName === "quiz") {
      result = await Quiz.destroy({ where: { id } });
    } else if (tableName === "question") {
      result = await Question.destroy({ where: { id } });
    } else if (tableName === "choice") {
      result = await Choice.destroy({ where: { id } });
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

router.post("/quiz-ranks", async (req, res) => {
  try {
    const { hit, miss, quizId, userId, startTime, endTime, scheduledFor } =
      req.body;
    console.log(hit, miss, quizId, userId, startTime, endTime, scheduledFor);

    await QuizRank.destroy({ where: { userId: userId, quizId: quizId } });
    // Create a new QuizRank instance
    const newRank = await QuizRank.create({
      hit,
      miss,
      quizId,
      userId,
      startTime,
      endTime,
      scheduledFor,
    });

    res.status(200).json(newRank);
  } catch (error) {
    res.json(error);
  }
});
router.get("/quiz-ranks", async (req, res) => {
  try {
    const { userId, quizId, scheduleDate, page } = req.query;
    const limit = 1000; // Limit results per page
    const offset = (page - 1) * limit;

    let whereClause = { quizId: quizId };
    if (userId) {
      whereClause.userId = userId;
    }
    if (scheduleDate) {
      whereClause.scheduledFor = {
        [Op.eq]: scheduleDate, // Assuming scheduleDate is a specific date
      };
    }
    console.log("schedule date:", scheduleDate);
    const { count, rows } = await QuizRank.findAndCountAll({
      where: whereClause,
      include: [{ model: User }],
      limit,
      offset,
      order: [
        ["hit", "DESC"],
        ["createdAt", "ASC"],
      ],
    });

    res.status(200).json({
      count,
      rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching quiz ranks:", error);
    res.status(500).json({ error: "Failed to fetch quiz ranks" });
  }
});

module.exports = router;
