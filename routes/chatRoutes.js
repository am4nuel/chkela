const express = require("express");
const router = express.Router();
const WebSocket = require("ws");
const { User, Message } = require("../models"); // Ensure correct path to your models
const cors = require("cors");
// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });

let clients = {}; // Dictionary to keep track of connected clients
router.use(cors());
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

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message);
    const { senderId, receiverId, content } = parsedMessage;
    console.log("Message received", senderId, receiverId, content);

    // Register the client
    if (clients[senderId] !== undefined) {
      clients[senderId] = ws;
    }

    // Send message to the recipient if they are connected
    if (clients[receiverId]) {
      clients[receiverId].send(
        JSON.stringify({
          senderId,
          receiverId,
          content,
        })
      );
    }

    // Create message in the database
    const createMessage = async (senderId, receiverId, content) => {
      if (senderId && receiverId && content) {
        try {
          await Message.create({ senderId, receiverId, content });
          console.log("Message created successfully");

          // Broadcast the message to all connected clients
          Object.values(clients).forEach((client) => {
            if (client && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  senderId,
                  receiverId,
                  content,
                })
              );
            }
          });
        } catch (error) {
          console.error("Error creating message:", error);
        }
      } else {
        console.error(
          "Validation failed: senderId, receiverId, and content must be provided"
        );
      }
    };

    createMessage(senderId, receiverId, content);
  });

  ws.on("close", () => {
    for (let key in clients) {
      if (clients[key] === ws) {
        clients[key] = null;
        break;
      }
    }
  });
});

// WebSocket server upgrade handler
router.use((req, res, next) => {
  if (req.headers.upgrade === "websocket") {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      wss.emit("connection", ws, req);
    });
  } else {
    next();
  }
});

module.exports = router;
