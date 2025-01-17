const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const db = require("./models");
const notesRouter = require("./routes/fileHandleRoute");
const quizRoutes = require("./routes/quiz");
const twilio = require("twilio");
const accountSid = "AC7740b619a515c2f2f7ef0ea6ba6a2427";
const authToken = "1ac8d3f48f624de0962ca889e20e2a49";
const client = twilio(accountSid, authToken);
const courseRoutes = require("./routes/courseRoutes");
const examRoutes = require("./routes/examRoutes");
const flashCardRoutes = require("./routes/flashCardRoutes");
const videoRoutes = require("./routes/videoRoutes");
const { Op } = require("sequelize");
const sequelize = require("sequelize");
const postRoutes = require("./routes/postRoutes");
const communityRoutes = require("./routes/communityRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const chatRoutes = require("./routes/chatRoutes"); // New chat route
const plainNoteRoutes = require("./routes/plainNoteRoutes");
const notificationRout = require("./routes/notificationRout");
const crypto = require("crypto");
const profileUpdate = require("./routes/profileUpdate"); // New chat route
const path = require("path");
const fs = require("fs");
const {
  User,
  Message,
  UserStatistics,
  Payment,
  FollowUser,
  FollowCommunity,
  Post,
  Referral,
  Community,
  Bank,
  FeedBack,
  GuideVideo,
  UserInterest,
  Scholar,
  Report,
} = require("./models");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
  perMessageDeflate: {
    threshold: 1024, // Only compress messages larger than 1 KB
  },
});
const admin = require("firebase-admin"); // Add this line to import firebase-admin
const serviceAccount = require("./chkela-25bd7-firebase-adminsdk-kilmx-1ee7ec0906.json"); // Replace with your file path
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
app.set("view engine", "ejs");
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.set("io", io);
// Routes
app.use("/uploads", express.static("uploads"));
app.use("/file", notesRouter);
app.use("/quiz", quizRoutes);
app.use("/course", courseRoutes);
app.use("/exam", examRoutes);
app.use("/card", flashCardRoutes);
app.use("/video", videoRoutes);
app.use("/post", postRoutes);
app.use("/community", communityRoutes);
app.use("/notification", notificationRout);
app.use("/payment", paymentRoutes);
app.use("/plainNote", plainNoteRoutes);
app.use("/update", profileUpdate);
app.use("/chat", chatRoutes); // Use the new chat route
app.use(express.static("client/build"));

// Socket.IO setup
let clients = {}; // Dictionary to keep track of connected clients

// Function to load users into the clients list
const loadClients = async () => {
  try {
    const users = await User.findAll();
    users.forEach((user) => {
      clients[user.id] = null;
    });
    console.log("Users loaded into clients list");
  } catch (error) {
    console.error("Error loading users:", error);
  }
};

// Load users when the server starts
loadClients();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    console.error("Connection error: User ID not provided");
    socket.disconnect(); // Disconnect invalid connection
    return;
  }

  // Register client
  clients[userId] = socket;
  console.log(`User ${userId} connected with socket ID: ${socket.id}`);

  // Handle incoming messages
  socket.on("message", async (data) => {
    try {
      const { senderId, receiverId, content, fullName, file, fileName } = data;

      // Validate required fields
      if (!senderId || !receiverId || (!content && !file)) {
        console.error(
          "Validation error: senderId, receiverId, and either content or file are required"
        );
        return;
      }

      let fileUrl = null;

      // Handle file upload
      if (file) {
        console.log("File detected in message");

        const uploadPath = path.join(__dirname, "uploads/mefile");
        const fileBuffer = Buffer.from(file.data, "base64");
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadPath, fileName);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Simulate file upload progress (send progress updates every 100ms)
        let uploadedBytes = 0;
        const totalBytes = fileBuffer.length;
        const chunkSize = 1024 * 10; // 10 KB per chunk

        // Function to simulate file writing with progress updates
        const writeFileWithProgress = () => {
          const interval = setInterval(async () => {
            const chunk = fileBuffer.slice(
              uploadedBytes,
              uploadedBytes + chunkSize
            );
            fs.appendFileSync(filePath, chunk);

            uploadedBytes += chunk.length;

            const progress = (uploadedBytes / totalBytes) * 100;
            socket.emit("uploadProgress" + senderId, {
              progress: Math.min(progress, 100),
            });

            if (uploadedBytes >= totalBytes) {
              clearInterval(interval);
              fileUrl = `uploads/mefile/${fileName}`;

              const message = await Message.create({
                senderId,
                receiverId,
                content,
                fileUrl,
                fileName,
              });
              console.log(`File uploaded successfully: ${fileUrl}`);
              const currentTime = new Date().toISOString();

              // Check if the recipient is connected
              if (clients[receiverId]) {
                // Fetch FCM token of the recipient
                const user = await User.findOne({
                  where: { id: receiverId },
                  attributes: ["fcmToken"],
                });

                if (user && user.fcmToken) {
                  const notification = {
                    notification: {
                      title: fullName,
                      body: content || "File sent",
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
                message.dataValues.fullName = fullName;
                // Emit message to the recipient
                clients[receiverId].emit("message", message.dataValues);
              } else {
                const user = await User.findOne({
                  where: { id: receiverId },
                  attributes: ["fcmToken"],
                });

                if (user && user.fcmToken) {
                  const notification = {
                    notification: {
                      title: fullName,
                      body: content || "File sent",
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
              }
            }
          }, 100); // Update every 100ms
        };

        writeFileWithProgress();
      } else {
        // Save the message to the database
        const message = await Message.create({
          senderId,
          receiverId,
          content,
          fileUrl,
          fileName,
        });

        const currentTime = new Date().toISOString();

        // Check if the recipient is connected
        if (clients[receiverId]) {
          // Fetch FCM token of the recipient
          const user = await User.findOne({
            where: { id: receiverId },
            attributes: ["fcmToken"],
          });

          if (user && user.fcmToken) {
            const notification = {
              notification: {
                title: fullName,
                body: content || "File sent",
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
          message.dataValues.fullName = fullName;

          clients[receiverId].emit("message", message.dataValues);
        } else {
          const user = await User.findOne({
            where: { id: receiverId },
            attributes: ["fcmToken"],
          });
          if (user && user.fcmToken) {
            const notification = {
              notification: {
                title: fullName,
                body: content || "File sent",
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
        }
      }
    } catch (err) {
      console.error("Error processing message:", err);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const [key, clientSocket] of Object.entries(clients)) {
      if (clientSocket === socket) {
        delete clients[key];
        console.log(`User ${key} disconnected`);
        break;
      }
    }
  });
});

app.post("/report", async (req, res) => {
  try {
    const { postId, reports } = req.body;

    // Validate the request
    if (!postId || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    // Prepare data for bulk insert
    const reportData = reports.map((reason) => ({
      postId,
      reportReason: reason,
    }));

    // Bulk create reports
    await Report.bulkCreate(reportData);

    res.status(200).json({ message: "Reports submitted successfully" });
  } catch (error) {
    console.error("Error submitting reports:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    // Create the user
    const userData = await User.create(req.body);

    // Generate unique promo code
    const promoCode = await generateUniquePromoCode(userData);

    // Update the user with the promo code
    await User.update({ promoCode }, { where: { id: userData.id } });

    // Retrieve the user and send response
    const user = await User.findOne({ where: { id: userData.id } });
    res.status(201).send({ user });
    // Create user statistics
    await UserStatistics.create({ userId: userData.id });

    // Check for a promo code in the request
    if (req.body.promoCode) {
      await checkAndApplyPromoCode(req.body.promoCode, userData.id);
    }
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send({ message: "Error creating user. Please try again." });
  }
});

const checkAndApplyPromoCode = async (promoCode, referredId) => {
  try {
    // Find user with the promo code
    const referringUser = await User.findOne({
      where: { promoCode },
    });

    if (referringUser) {
      // Create referral entry if promo code matches
      await Referral.create({
        referred: referredId,
        referredBy: referringUser.id,
      });
      return referringUser; // Return the referring user if found
    }
    // Find the user's statistics
    const userStats = await UserStatistics.findOne({
      where: { userId: referringUser.id },
    });

    if (!userStats) {
      return res.status(404).json({ error: "User statistics not found" });
    }
    userStats.point += 500;

    // Save the updated statistics
    await userStats.save();

    console.log("User not found with the provided promo code:", promoCode);
    return null; // No referring user found
  } catch (error) {
    console.error("Error applying promo code:", error);
    throw error;
  }
};

async function generateUniquePromoCode(user) {
  const generatePromoCode = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nameHash = 0;

    for (let i = 0; i < user.fullName.length; i++) {
      nameHash = user.fullName.charCodeAt(i) + ((nameHash << 5) - nameHash);
    }

    let randomLetters = "";
    for (let i = 0; i < 3; i++) {
      randomLetters += letters.charAt(Math.abs(nameHash + i) % letters.length);
    }

    let phone = user.phoneNumber.replace(/\D/g, "");
    let staticDigits =
      phone.length >= 8 ? phone.substring(5, 8) : phone.substring(0, 3);

    return `${randomLetters}${staticDigits}`;
  };

  let promoCode;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    // Set a limit on attempts
    promoCode = generatePromoCode();

    // Check if the promo code already exists in the database
    const existingPromoCode = await User.findOne({
      where: { promoCode },
    });

    exists = !!existingPromoCode; // Set exists to true if a promo code is found
    attempts++;
  }

  if (exists) {
    throw new Error(
      "Could not generate a unique promo code after multiple attempts."
    );
  }

  return promoCode;
}
app.get("/connected-users", (req, res) => {
  // Filter out users that have a null value (disconnected)
  const connectedUsers = Object.keys(clients).filter(
    (userId) => clients[userId] !== null
  );
  res.json({ connectedUsers });
});
// app.get("/connected-users", (req, res) => {
//   // Filter out users that have a null value (disconnected)
//   const connectedUsers = Object.keys(clients).filter(
//     (userId) => clients[userId] !== null
//   );

//   // Generate 147 unique dummy IDs between 1 and 300
//   const dummyUserIds = new Set();
//   while (dummyUserIds.size < 147) {
//     const randomId = Math.floor(Math.random() * 300) + 1;
//     // Ensure the dummy ID is not already in connectedUsers and dummyUserIds
//     if (
//       !connectedUsers.includes(randomId.toString()) &&
//       !dummyUserIds.has(randomId)
//     ) {
//       dummyUserIds.add(randomId);
//     }
//   }

//   // Combine the connected users with the dummy users
//   const allUsers = [...connectedUsers, ...Array.from(dummyUserIds).map(String)];

//   console.log(allUsers);
//   res.json({ connectedUsers: allUsers });
// });
app.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    // Find user by phoneNumber
    const userLog = await User.findOne({ where: { phoneNumber } });

    if (!userLog) {
      return res.status(404).send("User not found.");
    }

    // Check if password is valid
    const isPasswordValid = password === userLog.password;
    if (!isPasswordValid) {
      return res.status(401).send("Invalid password.");
    }

    // Check if the user exists in the UserStatistics table
    const userStatistics = await UserStatistics.findOne({
      where: { userId: userLog.id },
    });

    if (!userStatistics) {
      // If not, create a new record
      await UserStatistics.create({ userId: userLog.id });
    }

    // Fetch FCM token
    const userlgn = await User.findOne({
      where: { phoneNumber },
      attributes: ["fcmToken"],
    });

    const token = userlgn.fcmToken;
    console.log(token);

    // Send push notification
    const message = {
      notification: {
        title: "LogIn Detected",
        body: "New Loggin detected with a new device",
      },
      token,
    };

    try {
      const response = await admin.messaging().send(message);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    // Generate a random sessionId
    const sessionId = crypto.randomBytes(16).toString("hex");

    // Update the sessionId field in the database
    await User.update({ sessionId }, { where: { phoneNumber } });

    // Fetch the updated user data along with related models (Payment, UserStatistics)
    const user = await User.findOne({
      where: { phoneNumber },
      include: [Payment, UserStatistics],
    });

    // Send the updated user object as response
    res.status(200).send({ user });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("An error occurred during login.");
  }
});

app.post("/submit-feedback", async (req, res) => {
  const { userId, feedback } = req.body;

  // Basic validation
  if (!userId || !feedback) {
    return res
      .status(400)
      .json({ message: "User ID and feedback are required" });
  }

  try {
    // Create a new feedback entry
    const newFeedback = await FeedBack.create({
      userId: userId,
      feedBack: feedback,
    });

    return res.status(200).json({
      message: "Feedback submitted successfully",
      feedbackId: newFeedback.id,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to submit feedback", error: error.message });
  }
});
app.post("/check-session", async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    // Find the user by userId
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      // User not found
      return res.status(404).send("User not found.");
    }

    // Check if the sessionId matches
    if (user.sessionId === sessionId) {
      // Session matches, user is logged in on this device
      return res
        .status(200)
        .send("Session is valid. User is logged in on this device.");
    } else {
      // Session doesn't match, user is logged in on another device
      return res
        .status(403)
        .send("Session invalid. User is logged in on another device.");
    }
  } catch (error) {
    console.error("Error during session validation:", error);
    res.status(500).send("An error occurred during session validation.");
  }
});

app.get("/messages/:userId1/:userId2", async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      order: [["timestamp", "ASC"]], // Optional: to sort messages by timestamp
    });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
app.get("/users", async (req, res) => {
  try {
    const { page = 1, limit } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};

    const users = await User.findAll({
      where: whereClause,
      include: [{ model: UserStatistics }],
    });
    console.log(users[0].promoCode);
    res.json({
      users,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});
app.get("/single-user", async (req, res) => {
  try {
    const { userId } = req.query;
    const whereClause = { userId: userId };

    const user = await User.findOne({
      where: whereClause,
      include: [{ model: UserStatistics }],
    });
    res.json({
      user,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});
app.get("/users-filter", async (req, res) => {
  try {
    const { search, page = 1, limit } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { category: { [Op.like]: `%${search}%` } },
        { grade: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows: users, count: totalUsers } = await User.findAndCountAll({
      where: whereClause,
      offset,
      limit: Number(limit),
    });

    res.json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server Error" });
  }
});

app.post("/interests", async (req, res) => {
  const { userId, interests } = req.body;
  try {
    // First, clear any existing interests for the user
    await UserInterest.destroy({ where: { userId } });

    const userInterests = interests.map((interest) => ({
      userId,
      interest,
    }));

    await UserInterest.bulkCreate(userInterests);

    res.status(200).json({ message: "Interests submitted successfully" });
  } catch (error) {
    console.error("Error submitting interests:", error);
    res.status(500).json({ error: "Failed to submit interests" });
  }
});
app.post("/join", async (req, res) => {
  const { follower, followed, followedType } = req.body;
  console.log("data", follower, followed, followedType);

  try {
    let followerC;

    if (followedType === "User") {
      // Remove existing follow for users
      await FollowUser.destroy({
        where: { follower, followed },
      });
      // Create new follow for users
      followerC = await FollowUser.create({
        follower: follower,
        followed: followed,
      });
    } else if (followedType === "Community") {
      // Remove existing follow for communities
      await FollowCommunity.destroy({
        where: { follower, followed },
      });
      // Create new follow for communities
      followerC = await FollowCommunity.create({
        follower: follower,
        followed: followed,
      });
    }

    if (followerC) {
      console.log("created");
      res.status(200).send({ followerC });
    } else {
      console.log("not created");
      res.status(424).send({ followerC });
    }
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).send({ error: "An error occurred" });
  }
});

app.post("/check-following", async (req, res) => {
  const { follower, followed, type } = req.body;

  try {
    let found;

    if (type === "User") {
      found = await FollowUser.findOne({
        where: { follower, followed },
      });
    } else if (type === "Community") {
      found = await FollowCommunity.findOne({
        where: { follower, followed },
      });
    }

    if (found) {
      console.log("hit", follower, followed, type);
      res.status(200).send({ found });
    } else {
      console.log("miss", follower, followed, type);
      res.status(404).send({ message: "No following record found" });
    }
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).send({ error: "An error occurred" });
  }
});

app.post("/dismember", async (req, res) => {
  const { follower, followed, followedType } = req.body;
  console.log("data", follower, followed, followedType);

  try {
    let followerC;

    if (followedType === "User") {
      // Remove follow for users
      followerC = await FollowUser.destroy({
        where: { follower, followed },
      });
    } else if (followedType === "Community") {
      // Remove follow for communities
      followerC = await FollowCommunity.destroy({
        where: { follower, followed },
      });
    }

    if (followerC) {
      console.log("removed");
      res.status(200).send({ message: "Unfollow successful" });
    } else {
      console.log("not removed");
      res.status(404).send({ message: "No record found to unfollow" });
    }
  } catch (error) {
    console.log("something went wrong", error);
    res.status(500).send({ error: "An error occurred" });
  }
});

app.post("/count-return", async (req, res) => {
  const { userId, followedType } = req.body;

  // Validate input
  if (!userId || !followedType) {
    return res
      .status(400)
      .json({ error: "Missing required fields: userId and followedType" });
  }

  try {
    if (followedType === "User") {
      const followerCount = await FollowUser.count({
        where: { followed: userId },
      }); // Count followers based on userId and followedType

      // Count posts where userId matches the provided userId
      const postCount = await Post.count({
        where: { userId }, // Ensure this is the correct field name
      });

      // Fetch user statistics for the given userId
      const userStatistics = await UserStatistics.findOne({
        where: { userId },
      });

      // Prepare the response data
      const responseData = {
        followerCount,
        postCount,
        userStatistics: userStatistics || null,
      };
      console.log(responseData);
      res.status(200).json(responseData);
    } else {
      if (followedType === "Community") {
        console.log("back no");
        const followerCount = await FollowCommunity.count({
          where: { followed: userId },
        }); // Count followers based on userId and followedType

        // Count posts where userId matches the provided userId
        const postCount = await Post.count({
          where: { ownerType: userId }, // Ensure this is the correct field name
        });
        // Prepare the response data
        const responseData = {
          followerCount,
          postCount,
          userStatistics: null,
        };
        console.log(responseData);
        res.status(200).json(responseData);
      }
    }
  } catch (error) {
    console.error("Something went wrong:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

app.post("/update-user", async (req, res) => {
  const { birthDate, profileImage, gender, id } = req.body;
  console.log(birthDate, profileImage, gender, id);
  try {
    const update = await User.update(
      { birthDate, profileImage, gender },
      {
        where: { id },
      }
    );

    if (update) {
      console.log("updated");
      res.status(200).send({ update });
    } else {
      console.log("not updated");
      res.status(424).send({ update });
    }
  } catch (error) {
    console.log("something went wrong", error);
  }
});
app.post("/manage-pts", async (req, res) => {
  const { userId, point, actionType } = req.body;

  try {
    // Find the user's statistics
    const userStats = await UserStatistics.findOne({
      where: { userId: userId },
    });

    if (!userStats) {
      return res.status(404).json({ error: "User statistics not found" });
    }

    // Perform action based on actionType
    if (actionType === "add") {
      userStats.point += point;
    } else if (actionType === "sub") {
      if (userStats.point < point) {
        return res.status(400).json({ error: "Insufficient points" });
      }
      userStats.point -= point;
    } else {
      return res.status(400).json({ error: "Invalid action type" });
    }

    // Save the updated statistics
    await userStats.save();

    res.status(200).json({ success: true, newPoints: userStats.point });
  } catch (error) {
    console.error("Error managing points:", error);
    res.status(500).json({ error: "An error occurred while managing points" });
  }
});

app.get("/my/:userId/communities", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all communities that the user follows
    const communities = await Community.findAll({
      include: [
        {
          model: FollowCommunity,
          as: "Followers",
          where: { follower: userId },
        },
      ],
    });

    res.status(200).json({ communities });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching communities." });
  }
});

app.get("/users/:userId/following", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find users that the specified user follows using the FollowUser model
    const followingTrackers = await FollowUser.findAll({
      where: { follower: userId },
      include: [
        {
          model: User,
          as: "FollowedUser",
        },
      ],
    });

    // Extract and return the list of followed users
    const followedUsers = followingTrackers.map(
      (tracker) => tracker.FollowedUser
    );
    res.status(200).json(followedUsers);
  } catch (error) {
    console.error("Error fetching following users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch users who follow a particular user
app.get("/users/:userId/followers", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find users who follow the specified user using the FollowUser model
    const followerTrackers = await FollowUser.findAll({
      where: { followed: userId },
      include: [
        {
          model: User,
          as: "FollowerUser",
        },
      ],
    });

    // Extract and return the list of followers
    const followers = followerTrackers.map((tracker) => tracker.FollowerUser);
    res.status(200).json(followers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/users/contacts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch messages where userId is either sender or receiver
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      attributes: ["senderId", "receiverId"],
      raw: true,
    });

    // Extract unique user IDs from the messages
    const userIds = new Set();
    messages.forEach((message) => {
      if (message.senderId !== userId) {
        userIds.add(message.senderId);
      }
      if (message.receiverId !== userId) {
        userIds.add(message.receiverId);
      }
    });

    // Convert Set to array
    const userIdArray = Array.from(userIds);

    // Fetch user details for these user IDs
    const users = await User.findAll({
      where: {
        id: userIdArray,
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

app.get("/user-statistics", async (req, res) => {
  try {
    const userStatistics = await UserStatistics.findAll({
      include: [
        {
          model: User,
          required: true,
          attributes: {
            include: [
              // Add a subquery to fetch follow count
              [
                sequelize.literal(`(
                  SELECT COUNT(*)
                  FROM \`FollowUsers\` AS ft
                  WHERE ft.follower = \`User\`.\`id\`
                )`),
                "followCount",
              ],
            ],
          },
        },
      ],
      order: [["point", "DESC"]],
      limit: 50, // Limit to 50 rows
    });

    res.json(userStatistics);
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
});

app.post("/delete-social", async (req, res) => {
  const { id, action, tableType, content } = req.body;

  try {
    // Simulate deleting or updating an entry based on action and tableType
    if (tableType === "post") {
      if (action === "delete") {
        Post.destroy({ where: { id } });
        res.status(200).json({ message: "Post deleted successfully!" });
      } else {
        // Handle other actions like updating, archiving, etc.
        console.log(`Performing action ${action} on post with ID: ${id}`);
        res
          .status(200)
          .json({ message: `Action ${action} performed successfully!` });
      }
    } else if (tableType == "community") {
      if (action === "delete") {
        Community.destroy({ where: { id } });
        res.status(200).json({ message: "Community deleted successfully!" });
      } else {
        // Handle other actions like updating, archiving, etc.
        console.log(`Performing action ${action} on post with ID: ${id}`);
        res
          .status(200)
          .json({ message: `Action ${action} performed successfully!` });
      }
    } else {
      res.status(400).json({ error: "Invalid table type." });
    }
  } catch (error) {
    console.error("Error handling the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});
app.get("/referrals/:userId", async (req, res) => {
  try {
    // Get the userId from the request params
    const userId = req.params.userId;

    // Find the user by ID
    const referringUser = await User.findOne({
      where: { id: userId },
    });

    if (!referringUser) {
      return res.status(404).send({ error: "User not found." });
    }

    // Get the list of users referred by the current user
    const referrals = await Referral.findAll({
      where: { referredBy: userId },
      include: [
        {
          model: User,
          as: "ReferredUser", // Using the alias defined in the model associations
        },
      ],
    });

    // Send the promo code and the referred users
    res.status(200).send({
      promoCode: referringUser.promoCode, // This uses the promoCode getter method
      referredUsers: referrals,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching referrals." });
  }
});
// Route to fetch all bank records
app.get("/banks", async (req, res) => {
  try {
    const banks = await Bank.findAll(); // Fetch all rows from the Banks table
    return res.status(200).json(banks); // Return the results as JSON
  } catch (error) {
    console.error("Error fetching banks:", error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
});

app.get("/guide-video", async (req, res) => {
  try {
    const guideVideos = await GuideVideo.findAll();
    res.status(200).json(guideVideos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching guide videos." });
  }
});
app.post("/delete-record", async (req, res) => {
  const { tableName, id } = req.body;

  try {
    // Check if the table exists in the Sequelize models
    const Model = {
      post: Post,
      message: Message,
    }[tableName]; // Add more models as needed

    if (!Model) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    // Find and delete the record by its ID
    const result = await Model.destroy({
      where: { id },
    });

    if (result) {
      res.json({ message: `Record with ID ${id} deleted from ${tableName}` });
    } else {
      res.status(404).json({ error: "Record not found" });
    }
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/delete-user", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Disable foreign key checks
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { raw: true });

    // Delete the user
    const userDeleted = await User.destroy({ where: { id: user_id } });

    // Re-enable foreign key checks
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });

    if (userDeleted) {
      res
        .status(403)
        .json({ message: `User with ID ${user_id} deleted successfully.` });
    } else {
      res.status(404).json({ error: `User with ID ${user_id} not found.` });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/update-userfcm", async (req, res) => {
  const { userId, newData } = req.body;
  // Validate input
  if (!userId || !newData) {
    return res.status(400).json({ error: "Missing userId or newData" });
  }
  try {
    const [updatedRows] = await User.update(
      { fcmToken: newData }, // Fields to update
      { where: { id: userId } } // Condition for the user to update
    );

    if (updatedRows > 0) {
      // Successfully updated
      return res.status(200).json({ success: "User updated successfully" });
    } else {
      // No rows were updated, user might not exist
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
});
app.get("/scholars", async (req, res) => {
  try {
    // Get the page query parameter (default is page 1)
    const page = parseInt(req.query.page) || 1;

    // Set limit of 50 records per page
    const limit = 50;

    // Calculate the offset based on the current page
    const offset = (page - 1) * limit;

    // Fetch data from the Scholar table with pagination
    const scholars = await Scholar.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]], // Optional: you can order by createdAt or other fields
    });

    // Send the data along with pagination information
    res.json({
      data: scholars.rows, // This contains the fetched records
      pagination: {
        totalRecords: scholars.count, // Total number of records in the table
        totalPages: Math.ceil(scholars.count / limit), // Total pages
        currentPage: page, // Current page number
        perPage: limit, // Records per page
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.post("/update-location", async (req, res) => {
  try {
    // Extract userId, lat, and lng from the request body
    const { userId, lat, lng } = req.body;

    if (!userId || !lat || !lng) {
      return res
        .status(400)
        .json({ message: "Missing required fields: userId, lat, lng" });
    }

    // Find the user by userId
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's location
    user.lat = lat;
    user.lng = lng;

    // Save the changes
    await user.save();

    console.log(
      `User ${userId} updated their location to lat: ${lat}, lng: ${lng}`
    );

    // Send a success response
    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating location:", error);
    res
      .status(500)
      .json({ message: "Failed to update location", error: error.message });
  }
});

app.post("/reset-password", async (req, res) => {
  try {
    const { phone_number, fcm_token } = req.body;

    // Validate input
    if (!phone_number || !fcm_token) {
      return res
        .status(400)
        .json({ error: "Phone number and FCM token are required." });
    }
    // Validate phone number format
    if (!/^(07|09)[0-9]{8}$/.test(phone_number)) {
      return res.status(400).json({
        error: "Phone number must start with 07 or 09 and be 10 digits long.",
      });
    }

    // Find the user by phone number
    const user = await User.findOne({
      where: { phoneNumber: phone_number }, // Ensure the field name matches your database
      attributes: ["password"],
    });

    // If user is not found, return an error
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Construct the notification message
    const message = {
      notification: {
        title: "Password",
        body: `${user.password}`,
      },
      token: fcm_token,
    };

    const response = await admin.messaging().send(message);
    console.log(response);
    // Respond with success
    res.status(200).json({
      message: "Reset password request received.",
      pay_message: message,
    });
  } catch (error) {
    console.error("Error in /reset-password:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
});
app.post("/send-sms", async (req, res) => {
  const { to, body } = req.query; // Use req.query for query string parameters
  console.log("recieved");
  if (!to || !body) {
    return res
      .status(400)
      .json({ error: 'Please provide "to" and "body" in the request.' });
  }

  try {
    const message = await client.messages.create({
      from: "+17152026565", // Replace with your Twilio phone number
      to: to, // Use the "to" parameter from the query
      body: body, // Use the "body" parameter from the query
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully!",
      sid: message.sid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
let requestCount = 0;

app.use((req, res, next) => {
  requestCount++; // Increment request count
  console.log(`Request #${requestCount}: ${req.method} ${req.url}`);
  next();
});
const PORT = process.env.PORT || 3000;
db.sequelize.sync().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
