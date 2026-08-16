const express = require('express');
const router = express.Router();
const authController = require("../../controllers/auth/authController");

router.post('/login', authController.login);

// POST /api/auth/signup
router.post('/signup', authController.signup);

module.exports = router;