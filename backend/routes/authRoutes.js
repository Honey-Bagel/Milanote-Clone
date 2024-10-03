const express = require('express');
const { Signup, Login } = require("../controllers/authController");
const { userVerification, boardVerification } = require("../middleware/AuthMiddleware");

const router = express.Router();

// Signup
router.post("/signup", Signup);

// Login
router.post("/login", Login);

// Verification
router.post('/', userVerification);

// Verify Board Access
router.post('/b/:id', boardVerification);

module.exports = router;