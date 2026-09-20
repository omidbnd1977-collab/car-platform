const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimit");

router.post("/register", authLimiter, authController.register);

router.post("/login", authLimiter, authController.login);

module.exports = router;
