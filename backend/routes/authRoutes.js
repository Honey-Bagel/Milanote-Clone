const express = require('express');
const { Signup, Login } = require("../controllers/authController");
const { userVerification } = require("../middleware/AuthMiddleware");

const router = express.Router();

// Signup
router.post("/signup", Signup);

// Login
router.post("/login", Login);

// Verification
router.post('/', userVerification);

module.exports = router;