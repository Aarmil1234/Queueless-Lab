const express = require('express');
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const authMiddleware = require("../../middleware/authMiddleware");

router.post('/login', authController.login);

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/forget-password - request an OTP via SMS for a lab mobile number
router.post('/forget-password', authController.forgetPassword);

// POST /api/auth/reset-password - verify OTP and set a new password
router.post('/reset-password', authController.resetPassword);

// POST /api/auth/update-password - authenticated password change (current password required)
router.post('/update-password', authMiddleware, authController.updatePassword);

router.post('/logout', authMiddleware, authController.logout);

module.exports = router;