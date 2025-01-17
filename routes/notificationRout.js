const express = require("express");
const router = express.Router();
const { Notification } = require("../models"); // Ensure this path points to your models
const cors = require("cors");
const { Op } = require("sequelize");

router.use(express.json());
router.use(cors());

// Route to fetch notifications for a specific user
router.get("/notifications/:userId", async (req, res) => {
  const { userId } = req.params;
  const { page = 1, size = 100, search = "" } = req.query;

  try {
    const whereClause = {
      userId,
      ...(search && { title: { [Op.like]: `%${search}%` } }),
    };

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      limit: parseInt(size),
      offset: (page - 1) * size,
    });

    const totalPages = Math.ceil(notifications.count / size);

    res.json({
      notifications: notifications.rows,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send("Server error");
  }
});

// Route to create a new notification
router.post("/createNotification", async (req, res) => {
  const { userId, title, type, content, payload } = req.body;

  try {
    // Validation
    if (!userId || !title || !type || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create the notification
    const newNotification = await Notification.create({
      userId,
      title,
      type,
      content,
      payload,
    });

    return res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Error creating notification" });
  }
});

// Route to delete a notification
router.delete("/deleteNotification/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Find the notification by ID
    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Delete the notification
    await notification.destroy();

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification" });
  }
});

// Route to mark a notification as read
router.patch("/markAsRead/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all notifications for the given userId
    const notifications = await Notification.findAll({
      where: { userId },
    });

    if (!notifications || notifications.length === 0) {
      return res
        .status(404)
        .json({ message: "No notifications found for this user" });
    }

    // Update the isRead field for all notifications
    await Notification.update({ isRead: true }, { where: { userId } });

    res
      .status(200)
      .json({ message: "All notifications marked as read for the user" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Error marking notifications as read" });
  }
});

module.exports = router;
