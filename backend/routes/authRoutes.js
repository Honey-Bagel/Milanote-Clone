const express = require('express');
const { Signup, Login, fetchUserId } = require("../controllers/authController");
const { userVerification, boardVerification } = require("../middleware/AuthMiddleware");

const router = express.Router();

// Signup
router.post("/signup", Signup);

// Login
router.post("/login", Login);

// Verification
router.post('/', userVerification);

// Given an email input fetch the user's id
router.post('/email', fetchUserId);

// Verify Board Access
router.post('/b/:id', boardVerification);

module.exports = router;