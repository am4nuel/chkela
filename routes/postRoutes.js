const cors = require("cors");
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const multer = require("multer");
const admin = require("firebase-admin");
const path = require("path");
const {
  Post,
  PostImage,
  Comment,
  User,
  Reply,
  Community,
  Reaction,
} = require("../models");
// Configure bodyParser to handle JSON data
router.use(bodyParser.json());
router.use(express.json());
router.use(cors());
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/postimages"); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [
    // Image formats
    "image/jpeg", // JPG/JPEG
    "image/jpg", // JPG (alternative MIME type)
    "image/png", // PNG
    "image/gif", // GIF
    "image/webp", // WEBP
    "image/bmp", // BMP
    "image/svg+xml", // SVG
    "image/tiff", // TIFF
    // Video formats
    "video/mp4", // MP4
    "video/mpeg", // MPEG
    "video/x-msvideo", // AVI
    "video/x-matroska", // MKV
    "video/quicktime", // MOV
    "video/3gpp", // 3GP
    "video/webm", // WEBM
    "video/ogg", // OGG
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
// Route to create a new post
router.post(
  "/create-post",
  upload.array("mediaFiles", 10),
  async (req, res) => {
    try {
      const { userId, title, content, ownerType } = req.body;
      const mediaPaths = req.files ? req.files.map((file) => file.path) : [];

      // Create a new post in the database
      const newPost = await Post.create({
        userId,
        title,
        content,
        ownerType,
      });

      // If there are media files, associate them with the post
      if (mediaPaths.length > 0) {
        const mediaPromises = mediaPaths.map((mediaPath) =>
          PostImage.create({
            postId: newPost.id,
            imagePath: mediaPath, // Store the path of the media file
          })
        );
        await Promise.all(mediaPromises);
      }

      res
        .status(201)
        .json({ message: "Post created successfully", post: newPost });
    } catch (error) {
      console.error("Error creating post:", error);
      res
        .status(500)
        .json({ message: "Failed to create post", error: error.message });
    }
  }
);
router.get("/latest-posts", async (req, res) => {
  const postId = req.query.id;
  const userId = req.query.userId;
  const communityId = req.query.communityId; // Get the post ID if provided
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = 50; // Default to 10 posts per page
  const offset = (page - 1) * limit;

  try {
    if (postId) {
      // Fetch a single post with its comments and replies
      const post = await Post.findOne({
        where: { id: postId },
        include: [
          {
            model: Comment,
            include: [
              {
                model: Reply,
                include: [User], // Include user who posted the reply
              },

              User,
              // Include user who posted the comment
            ],
          },
          { model: Community, as: "Community" },
          { model: PostImage, attributes: ["imagePath"] },
          User, // Include user who posted the post
          Reaction,
        ],
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      res.status(200).json(post);
    } else if (userId) {
      // Fetch a single post with its comments and replies
      const post = await Post.findAll({
        where: { userId: userId },
        include: [
          { model: Community, as: "Community" },
          {
            model: Comment,

            include: [
              {
                model: Reply,
                include: [User], // Include user who posted the reply
              },

              User,

              // Include user who posted the comment
            ],
          },
          { model: PostImage, attributes: ["imagePath"] },
          User, // Include user who posted the post
          Reaction,
        ],
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      res.status(200).json(post);
    } else if (communityId) {
      console.log("accessed by community", communityId);
      // Fetch a single post with its comments and replies
      const post = await Post.findAll({
        where: { ownerType: communityId },
        include: [
          {
            model: Comment,
            include: [
              {
                model: Reply,
                include: [User], // Include user who posted the reply
              },

              User,

              // Include user who posted the comment
            ],
          },
          { model: Community, as: "Community" },
          { model: PostImage, attributes: ["imagePath"] },
          User, // Include user who posted the post
          Reaction,
        ],
      });

      if (!post) {
        return res.status(404).json({ error: "Post not found." });
      }

      res.status(200).json(post);
    } else {
      // Fetch paginated posts
      const posts = await Post.findAll({
        order: [["createdAt", "DESC"]],
        limit: limit,
        offset: offset,
        include: [
          { model: User },
          { model: Community, as: "Community" },
          { model: Reaction }, // Include user data
          { model: PostImage, attributes: ["imagePath"] },
          {
            model: Comment,
            include: [
              {
                model: User,
                // attributes: ["id", "name"], // Include only necessary user attributes
              },
              {
                model: Reply,
                include: [
                  {
                    model: User,
                    // attributes: ["id", "name"], // Include user details for replies
                  },
                  {
                    model: Reply, // Include nested replies
                    as: "ParentReply",
                    include: [
                      {
                        model: User,
                        // attributes: ["id", "name"], // Include user details for nested replies
                      },
                      {
                        model: Reply, // Include nested replies
                        as: "ParentReply",
                        include: [
                          {
                            model: User,
                            // attributes: ["id", "name"], // Include user details for nested replies
                          },
                          {
                            model: Reply, // Include nested replies
                            as: "ParentReply",
                            include: [
                              {
                                model: User,
                                // attributes: ["id", "name"], // Include user details for nested replies
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],

            order: [["createdAt", "ASC"]], // Order comments by creation date
          },
        ],
      });
      res.status(200).json(posts);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "An error occurred while fetching posts." });
  }
});
router.get("/search-posts", async (req, res) => {
  try {
    const query = req.query.query || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Convert query to lowercase for case-insensitive search
    const lowerCaseQuery = query.toLowerCase();

    // Search for posts by title or content
    const { rows: posts, count: totalPosts } = await Post.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${lowerCaseQuery}%` } }, // case-insensitive search
          { content: { [Op.like]: `%${lowerCaseQuery}%` } },
        ],
      },
      include: [PostImage, User],
      offset,
      limit,
    });

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      totalPages,
      currentPage: page,
      totalPosts,
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/comment", async (req, res) => {
  const { content, userId, postId, replyTo, type } = req.body;
  console.log({ content, userId, postId, replyTo, type });
  try {
    if (type === "comment") {
      // Handle comment submission
      const newComment = await Comment.create({
        content,
        userId,
        postId,
      });
      const user = await User.findOne({
        where: { id: userId },
        attributes: ["fcmToken"],
      });

      if (user && user.fcmToken) {
        const notification = {
          notification: {
            title: "New comment",
            body: content || "someone commented",
          },
          token: user.fcmToken,
        };
        try {
          await admin.messaging().send(notification);
          console.log("Push notification sent successfully");
        } catch (err) {
          console.error("Error sending push notification:", err);
        }
      } else {
        console.warn(`FCM token not found for user ${receiverId}`);
      }
      res.status(200).json(newComment);
    } else if (type === "reply") {
      // Handle reply submission
      const newReply = await Reply.create({
        content,
        userId,
        replyTo,
      });
      const user = await User.findOne({
        where: { id: userId },
        attributes: ["fcmToken"],
      });

      if (user && user.fcmToken) {
        const notification = {
          notification: {
            title: "New Reply",
            body: content || "someone replied",
          },
          token: user.fcmToken,
        };
        try {
          await admin.messaging().send(notification);
          console.log("Push notification sent successfully");
        } catch (err) {
          console.error("Error sending push notification:", err);
        }
      } else {
        console.warn(`FCM token not found for user ${receiverId}`);
      }
      res.status(200).json(newReply);
    } else {
      res.status(400).json({ error: "Invalid type" });
    }
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/vote", async (req, res) => {
  try {
    const { postId, voteType } = req.body;

    // Log received data
    console.log(`Received postId: ${postId}, voteType: ${voteType}`);

    // Validate input
    if (!postId || !voteType) {
      console.error("Invalid request: Missing postId or voteType");
      return res.status(400).json({ error: "Missing postId or voteType" });
    }

    const post = await Post.findByPk(postId);

    // Check if post was found
    if (!post) {
      console.error(`Post not found: postId ${postId}`);
      return res.status(404).json({ error: "Post not found" });
    }

    // Update vote count based on vote type
    if (voteType === "upvote") {
      post.upVotes += 1;
      console.log(`Upvoted postId: ${postId}`);
    } else if (voteType === "downvote") {
      post.downVotes += 1;
      console.log(`Downvoted postId: ${postId}`);
    } else {
      console.error(`Invalid voteType: ${voteType}`);
      return res.status(400).json({ error: "Invalid voteType" });
    }

    // Save the updated post
    await post.save();
    console.log(
      `Post saved successfully: postId ${postId}, upVotes: ${post.upVotes}, downVotes: ${post.downVotes}`
    );

    // Return the updated post
    res.json(post);
  } catch (error) {
    console.error(
      `Error processing vote for postId ${req.body.postId}:`,
      error
    );
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/comments", async (req, res) => {
  const { content, userId, type, postId, commentId, replyParentId } = req.body;
  try {
    let newContent;
    // Create the content based on the type
    switch (type) {
      case "comment":
        newContent = {
          content,
          postId,
          userId,
        };
        await Comment.create(newContent);
        break;
      case "reply":
        newContent = {
          content,
          commentId,
          userId,
        };
        await Reply.create(newContent);
        break;

      case "nReply":
        newContent = {
          content,
          commentId,
          parentReplyId: replyParentId,
          userId,
        };
        await Reply.create(newContent);
        break;

      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    res.status(200).json(newContent);
  } catch (error) {
    console.error("Error creating content:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/posts/:postId/comments", async (req, res) => {
  const { postId } = req.params;

  try {
    // Fetch all comments for the post, including the user and replies
    const comments = await Comment.findAll({
      where: { PostId: postId },
      include: [
        {
          model: User,
          // attributes: ["id", "name"], // Include only necessary user attributes
        },
        {
          model: Reply,
          include: [
            {
              model: User,
              // attributes: ["id", "name"], // Include user details for replies
            },
            {
              model: Reply, // Include nested replies
              as: "ParentReply",
              include: [
                {
                  model: User,
                  // attributes: ["id", "name"], // Include user details for nested replies
                },
              ],
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]], // Order comments by creation date
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
});

router.post("/react", async (req, res) => {
  const { postId, userId, reactionType } = req.body;

  try {
    // Find if the user has already reacted to this post
    await Reaction.destroy({
      where: { postId, userId },
    });
    let reaction = await Reaction.findOne({
      where: { postId, userId },
    });

    if (reaction) {
      // If the user already reacted, update the reaction
      reaction[reactionType] = reaction[reactionType]
        ? reaction[reactionType] + 1
        : 1;
      await reaction.save();
    } else {
      // If the user hasn't reacted, create a new reaction record
      reaction = await Reaction.create({
        postId,
        userId,
        [reactionType]: 1,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reaction updated successfully!",
      data: reaction,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the reaction.",
    });
  }
});
router.patch("/comment/:id/:type/:action", async (req, res) => {
  const { id, type, action } = req.params;

  if (!["like", "dislike"].includes(type)) {
    return res
      .status(400)
      .json({ message: 'Invalid type. Must be "like" or "dislike".' });
  }

  if (!["increment", "decrement"].includes(action)) {
    return res
      .status(400)
      .json({ message: 'Invalid action. Must be "increment" or "decrement".' });
  }

  try {
    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Determine the column to update based on the "type"
    const columnToUpdate = type === "like" ? "likeCount" : "disLikeCount";

    // Increment or decrement based on the "action"
    if (action === "increment") {
      comment[columnToUpdate] = comment[columnToUpdate]
        ? comment[columnToUpdate] + 1
        : 1;
    } else if (action === "decrement") {
      comment[columnToUpdate] = comment[columnToUpdate]
        ? comment[columnToUpdate] - 1
        : 0;
    }

    // Save the updated comment
    await comment.save();

    // Return the updated comment
    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.patch("/reply/:id/:type/:action", async (req, res) => {
  const { id, type, action } = req.params;

  // Validate "type" and "action" parameters
  if (!["like", "dislike"].includes(type)) {
    return res
      .status(400)
      .json({ message: 'Invalid type. Must be "like" or "dislike".' });
  }

  if (!["increment", "decrement"].includes(action)) {
    return res
      .status(400)
      .json({ message: 'Invalid action. Must be "increment" or "decrement".' });
  }

  try {
    const reply = await Reply.findByPk(id);

    if (!reply) {
      return res.status(404).json({ message: "Reply not found." });
    }

    // Determine the column to update based on the "type"
    const columnToUpdate = type === "like" ? "likeCount" : "disLikeCount";

    // Increment or decrement based on the "action"
    if (action === "increment") {
      reply[columnToUpdate] = reply[columnToUpdate]
        ? reply[columnToUpdate] + 1
        : 1;
    } else if (action === "decrement") {
      reply[columnToUpdate] = reply[columnToUpdate]
        ? Math.max(reply[columnToUpdate] - 1, 0) // Prevent negative values
        : 0;
    }

    // Save the updated reply
    await reply.save();

    // Return the updated reply
    res.status(200).json({ message: "Reply updated successfully", reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
