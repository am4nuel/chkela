const express = require("express");
const fileRouter = express.Router();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { Op, where } = require("sequelize");
const { Note, PlainNote } = require("../models");
const fs = require("fs");
fileRouter.use(cors());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/notes/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
};
fileRouter.post("/createNote", upload.array("files", 10), async (req, res) => {
  const { titles, grade, category, course, chapters } = req.body;
  const files = req.files;

  // Arrays to hold file data
  const existingFiles = [];
  const newFiles = [];

  try {
    // Ensure titles and grades are treated as arrays
    const titlesArray = Array.isArray(titles) ? titles : [titles];
    const chapterArray = Array.isArray(chapters) ? chapters : [chapters];
    console.log(chapterArray);
    // Query the database to check for existing titles
    const existingNotes = await Note.findAll({
      where: {
        title: { [Op.in]: titlesArray },
      },
    });

    // Create a map of existing titles to their records
    const existingNoteMap = new Map(
      existingNotes.map((note) => [note.title, note])
    );

    // Process each uploaded file
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const fileTitle = titlesArray[index];
      const fileGrade = grade;
      const filePath = file.path;
      const fileCategory = category || "None";
      const fileCourse = course;
      const fileChapter = chapterArray[index] || "None";
      // Sanitize the file name by removing any leading random numbers
      const fileName = path.basename(file.originalname);
      const sanitizedFileName = fileName.replace(/^\d+-/, "");
      const newFilePath = path.join("uploads/notes", sanitizedFileName);

      // Check if the file already exists in the database
      if (existingNoteMap.has(fileTitle)) {
        const existingNote = existingNoteMap.get(fileTitle);

        // Construct the old file path
        const oldFilePath = path.join("uploads/notes", existingNote.filepath);

        // Remove the old file if it exists and is not the same as the new file
        if (fs.existsSync(oldFilePath) && oldFilePath !== newFilePath) {
          fs.unlinkSync(oldFilePath);
        }

        // Update the existing file record in the database
        await Note.update(
          {
            filepath: sanitizedFileName,
            grade: fileGrade,
            course: fileCourse,
            chapters: fileChapter,
            category: fileCategory,
            title: fileTitle,
          },
          { where: { title: fileTitle } }
        );

        existingFiles.push({
          title: fileTitle,
          originalName: file.originalname,
          path: newFilePath,
        });
      } else {
        // Add new file to the list
        newFiles.push({
          title: fileTitle,
          grade: fileGrade,
          filepath: sanitizedFileName,
          category: fileCategory,
          course: fileCourse,
          chapter: fileChapter,
        });
      }

      // Rename the file if it exists
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, newFilePath);
      } else {
        console.error(`File not found: ${filePath}`);
      }
    }

    // Insert only new files into the database
    const insertPromises = newFiles.map((fileData) => Note.create(fileData));
    await Promise.all(insertPromises);

    // Prepare the response data
    const response = {
      message:
        newFiles.length === 0
          ? "All the files already exist"
          : "Notes uploaded successfully!",
      insertedCount: newFiles.length,
      existingFilesCount: existingFiles.length,
      existingFiles: existingFiles,
    };
    res.status(201).json(response);
  } catch (error) {
    console.error("Error uploading notes:", error);
    res.status(500).json({ message: "Error uploading notes" });
  }
});

fileRouter.get("/notes", async (req, res) => {
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
      const note = await Note.findByPk(id);
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
    const { count, rows } = await Note.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { grade: { [Op.like]: `%${grade}%` } },
          { course: { [Op.like]: `%${course}%` } },
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

fileRouter.post("/updateNote", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { grade, title, id, category, course, chapter } = req.body;

    if (!grade || !title || !id || !category || !course || !chapter) {
      return res
        .status(400)
        .json({ message: "Missing required data (grade, title, id)" });
    }

    // Fetch the note to get the current filePath
    const note = await Note.findOne({ where: { id } });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    if (file) {
      const oldFilePath = "uploads/notes/" + note.dataValues.filepath;

      if (fs.existsSync(oldFilePath)) {
        console.log(oldFilePath);
        fs.unlinkSync(oldFilePath);
      }
    }

    const updateData = { grade, title, category, chapter, course };
    if (file) {
      updateData.filepath = file.originalname; // Save the new file's original name in the database
    }
    console.log(updateData);
    // Update the note in the database
    const updatedNote = await Note.update(updateData, {
      where: { id },
    });

    if (!updatedNote[0]) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({
      message: file
        ? "File uploaded and replaced successfully, and data updated."
        : "Data updated successfully without file replacement.",
      grade,
      title,
      id,
    });
  } catch (error) {
    console.error("Error handling file upload:", error);
    res.status(500).json({ message: "Error handling file upload" });
  }
});

fileRouter.get("/all-notes", async (req, res) => {
  // const { grade, category } = req.query;

  try {
    // let notes;

    // // Construct the where clause with direct equality checks
    // const whereClause = {
    //   grade: grade,
    // };

    // // Conditionally add the category filter if it's provided
    // if (category) {
    //   whereClause.category = category;
    //   whereClause.curriculum = "old";
    // }

    // if (grade == "12") {
    //   notes = await Note.findAll({
    //     where: {
    //       category: {
    //         [Op.in]: [category, "Both"],
    //       },
    //       curriculum: "old",
    //     },
    //   });
    // } else {
    //   notes = await Note.findAll({ where: whereClause });
    // }
    const notes = await Note.findAll();
    // Send response only once
    res.json(notes);
  } catch (error) {
    console.error("Error retrieving notes:", error);
    res.status(500).json({ message: "Error retrieving notes" });
  }
});
fileRouter.get("/all-plain-notes", async (req, res) => {
  // const { grade, category } = req.query;

  try {
    // let notes;

    // // Construct the where clause with direct equality checks
    // const whereClause = {
    //   grade: grade,
    // };

    // // Conditionally add the category filter if it's provided
    // if (category) {
    //   whereClause.category = category;
    // }

    // if (grade == "12") {
    //   notes = await PlainNote.findAll({
    //     where: {
    //       category: {
    //         [Op.in]: [category, "Both"],
    //       },
    //     },
    //   });
    // } else {
    //   notes = await PlainNote.findAll({ where: whereClause });
    // }
    const notes = await PlainNote.findAll();
    // Send response only once
    res.json(notes);
  } catch (error) {
    console.error("Error retrieving plain notes:", error);
    res.status(500).json({ message: "Error retrieving plain notes" });
  }
});
fileRouter.get("/sample-notes", async (req, res) => {
  // const { grade, category } = req.query;

  try {
    //let notes;
    // const whereClause = {
    //   grade: grade,
    // };

    // // Assign courseId based on grade and category
    // let courseId;

    // if (category === "Natural" && grade != "12") {
    //   if (grade == "11") courseId = 19;
    //   if (grade == "10") courseId = 12;
    //   if (grade == "9") courseId = 2;
    // } else if (category === "Social" && grade != "12") {
    //   if (grade == "11") courseId = 21;
    //   if (grade == "10") courseId = 14;
    //   if (grade == "9") courseId = 7;
    // }

    // // Add courseId to the where clause if it's defined
    // if (courseId) {
    //   whereClause.courseId = courseId;
    // }

    // if (grade == "12") {
    //   // For grade 12, return one note from each grade
    //   const grades = ["9", "10", "11","12"];
    //   notes = await Promise.all(
    //     grades.map(async (g) => {
    //       let courseIdForGrade;
    //       if (category === "Natural") {
    //         if (g == "11") courseIdForGrade = 19;
    //         if (g == "10") courseIdForGrade = 12;
    //         if (g == "9") courseIdForGrade = 2;
    //         if (g == "12") courseIdForGrade = 1;
    //       } else if (category === "Social") {
    //         if (g == "11") courseIdForGrade = 21;
    //         if (g == "10") courseIdForGrade = 14;
    //         if (g == "9") courseIdForGrade = 7;
    //           if (g == "12") courseIdForGrade = 34;
    //       }
    //       return await PlainNote.findOne({
    //         where: { grade: g, courseId: courseIdForGrade },
    //       });
    //     })
    //   );
    // } else {
    //   // For grades other than 12, fetch notes based on the constructed whereClause
    //   notes = await PlainNote.findAll({ where: whereClause });
    // }
    const notes = await PlainNote.findAll();
    // Send the response
    res.json(notes);
  } catch (error) {
    console.error("Error retrieving plain notes:", error);
    res.status(500).json({ message: "Error retrieving plain notes" });
  }
});
module.exports = fileRouter;
