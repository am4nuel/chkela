// Import required modules
const express = require("express");
const admin = require("firebase-admin"); // Add this line to import firebase-admin

const router = express.Router();
router.use(express.json());

router.post("/send-message", async (req, res) => {
  const { token, title, body } = req.body;
  console.log(token, title, body);
  if (!token || !title || !body) {
    return res
      .status(400)
      .json({ error: "Missing required fields: token, title, body" });
  }

  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    res
      .status(200)
      .json({ success: true, message: "Message sent successfully", response });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
      details: error.message,
    });
  }
});

module.exports = router;
