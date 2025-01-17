const express = require("express");
const router = express.Router();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Payment, User, UserStatistics } = require("../models");
const { where } = require("sequelize");
var request = require("request");
var { Chapa } = require("chapa-nodejs");

var text_ref, phone_Number;

const chapa = new Chapa({
  secretKey: "Bearer CHASECK-6ACejoK7SY7T0GnhNn5kv5b3TwE0LbXD",
});
router.get("/", function (req, res) {
  console.log("Hello, world!");
  res.send("Welcome to the server!");
});
router.use(cors());
router.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/payment";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use(express.urlencoded({ extended: true }));

// Route to handle payment form submission
router.post(
  "/submit-payment",
  upload.single("receiptImage"),
  async (req, res) => {
    const { transactionNumber, userId, bankName, pricePackage } = req.body;
    const receiptImage = req.file;
    console.log("payment accessed");
    var newData = {};
    if (!transactionNumber && !receiptImage) {
      return res.status(400).json({
        error: "Either transaction number or receipt image is required.",
      });
    }

    if (transactionNumber) {
      console.log(`Transaction Number: ${transactionNumber}`);
      newData.transactionNumber = transactionNumber;
    }

    if (receiptImage) {
      console.log(`Receipt Image Path: ${receiptImage.path}`);
      newData.receiptImage = receiptImage.path;
    }
    newData.userId = userId;
    newData.bankName = bankName;
    newData.pricePackage = pricePackage;
    await Payment.destroy({ where: { userId } });
    await Payment.create(newData);
    req.app.get("io").emit("paymentNotice", newData);
    res.status(200).json({ message: "Form submitted successfully." });
  }
);
router.get("/payment-requests", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { rows: payments, count: totalPayments } =
      await Payment.findAndCountAll({
        where: { status: ["unapproved", "declined"] },
        include: {
          model: User,
          required: true,
          include: {
            model: UserStatistics,
          },
        },
        offset,
        limit: Number(limit),
      });

    res.json({
      payments,
      totalPayments,
      totalPages: Math.ceil(totalPayments / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Server Error" });
  }
});
router.post("/approval", async (req, res) => {
  try {
    const { userId, action, pricePackage } = req.body;
    console.log(userId, action);
    if (action === "approve") {
      const currentDate = new Date().toISOString();
      await Payment.update(
        {
          status: "approved",
        },
        { where: { userId } }
      );
      await UserStatistics.update(
        {
          paymentStatus: "paid",
          createdAt: currentDate,
          pricePackage: pricePackage,
        },
        { where: { userId } }
      );

      res.status(200).json("approval succeeded");
    } else {
      await Payment.update(
        {
          status: "declined",
        },
        { where: { userId } }
      );

      res.status(200).json("Request Declined");
    }
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/status/:userId", async (req, res) => {
  const userId = req.params.userId;
  const payment = await UserStatistics.findOne({
    where: { userId: userId, paymentStatus: "paid" },
  });
  console.log(userId);
  if (payment) {
    res
      .status(200)
      .json({
        message: "Congratulations! Your Payment Has Been Approved!",
        payment,
      });
  } else {
    const payment = await Payment.findOne({
      where: { userId: userId, status: "declined" },
    });
    if (payment) {
      res.status(406).json({
        message:
          "Your Request has been declined.Please call us for more information",
      });
    } else {
      res.status(403).json({
        message:
          "Your Payment Is Under Review! We Will Get Back To You Shortly.",
      });
    }
  }
});

router.post("/pay-request", async function (req, res) {
  try {
    // Extract parameters from the request body
    const {
      amount,
      firstName,
      lastName,
      email,
      phoneNumber,
      userId,
      pricePackage,
    } = req.body;

    // Trim the pricePackage to remove any leading/trailing whitespace
    const trimmedPricePackage = pricePackage.trim();

    // Encode pricePackage to ensure it's URL-safe
    const encodedPricePackage = encodeURIComponent(trimmedPricePackage);

    // Generate transaction reference
    const text_ref = await chapa.genTxRef();

    // Call the Chapa API to initialize payment
    const response = await chapa.initialize({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone_number: phoneNumber,
      currency: "ETB",
      amount: amount,
      tx_ref: text_ref,
      callback_url: `https://chkela.app.talk-close.com/payment/pay?text_ref=${text_ref}&userId=${userId}&pricePackage=${encodedPricePackage}`,
      return_url: `https://chkela.com`,
      customization: {
        title: "Test Title",
        description: "Test Description",
      },
    });

    // Send the response back to the client
    res.send(response);
  } catch (error) {
    // Log detailed error information
    console.error("Error in /pay-request route:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body, // Log the incoming request data
    });

    if (error.response) {
      // If the error comes from Chapa API, log the API response
      console.error("Chapa API Error:", {
        status: error.response.status,
        data: error.response.data, // Log the response data from the Chapa API
      });
    }

    // Return an error response to the client
    res.status(500).json({
      message: "An error occurred while processing the payment.",
      error: error.message || "Unknown error",
    });
  }
});

router.get("/pay", async function (req, res) {
  const text_ref = req.query.text_ref;
  const userId = req.query.userId;
  const pricePackage = req.query.pricePackage;
  console.log("Text Ref:", text_ref);
  console.log("User ID:", userId);

  var options = {
    method: "GET",
    url: "https://api.chapa.co/v1/transaction/verify/" + text_ref,
    headers: {
      Authorization: "Bearer CHASECK-6ACejoK7SY7T0GnhNn5kv5b3TwE0LbXD",
    },
  };
  const currentDate = new Date().toISOString();
  await UserStatistics.update(
    {
      paymentStatus: "paid",
      createdAt: currentDate,
      pricePackage: pricePackage,
    },
    { where: { userId } }
  );
  request(options, function (error, response) {
    if (error) throw new Error(error);
    const responseBody = JSON.parse(response.body);
    res.send(`<style>
  /* Container styling */
  .card-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 20px; /* Added padding for smaller screens */
    background-color: #ffffff; /* Optional background color */
  }

  /* Card styling */
  .card {
    background-color: #f2f2f2;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Add a slight shadow for better visibility */
    max-width: 90%; /* Restrict card width on smaller screens */
    width: 400px; /* Default width for larger screens */
  }

  /* Title styling */
  .title {
    font-size: 24px;
    margin-bottom: 10px;
    font-weight: bold;
    color: #333333; /* Ensure contrast for accessibility */
  }

  /* Message styling */
  .message {
    font-size: 18px;
    color: #555555; /* Softer color for the message text */
    line-height: 1.5; /* Improve readability */
  }

  .purple-text {
    color: purple;
    font-weight: bold; /* Highlight purple text */
  }

  /* Media queries for smaller devices */
  @media (max-width: 768px) {
    .card {
      padding: 15px; /* Reduce padding on smaller screens */
    }

    .title {
      font-size: 20px; /* Adjust font size for titles */
    }

    .message {
      font-size: 16px; /* Adjust font size for messages */
    }
  }

  /* Media queries for very small devices */
  @media (max-width: 480px) {
    .card {
      padding: 10px;
    }

    .title {
      font-size: 18px;
    }

    .message {
      font-size: 14px;
    }
  }
</style>

<div class="card-container">
  <div class="card">
    <h2 class="title">Payment Completed</h2>
    <p class="message">
      You Have Paid For Your Event <span class="purple-text">Eventify</span>
    </p>
  </div>
</div>

`);
  });
});
module.exports = router;
