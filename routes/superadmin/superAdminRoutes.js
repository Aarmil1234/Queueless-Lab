const express = require("express");
const superAdminController = require("../../controllers/superadmin/superAdminController");
const superAdminAuth = require("../../middleware/superAdminAuth");

const router = express.Router();

// ---------- Auth (public) ----------
// POST /api/super-admin/login
router.post("/login", superAdminController.loginSuperAdmin);

// POST /api/super-admin/register - creates the FIRST super admin only (blocked once one exists)
router.post("/register", superAdminController.registerFirstSuperAdmin);

// POST /api/super-admin/forgot-password - send OTP to registered mobile number
router.post("/forgot-password", superAdminController.forgotPassword);

// POST /api/super-admin/verify-otp - optional check before the new-password form
router.post("/verify-otp", superAdminController.verifyOtp);

// POST /api/super-admin/reset-password - verify OTP and set a new password
router.post("/reset-password", superAdminController.resetPassword);

// ---------- Everything below requires a super admin token ----------
router.use(superAdminAuth);

router.get("/me", superAdminController.getProfile);
router.post("/change-password", superAdminController.changePassword);

// POST /api/super-admin/admins - logged-in super admin adds another super admin
router.post("/admins", superAdminController.createSuperAdmin); // --- not used

// GET /api/super-admin/dashboard/counts?filter=today|yesterday|thisWeek|thisMonth|lastMonth
router.get("/dashboard/counts", superAdminController.getDashboardCounts);

// GET /api/super-admin/dashboard/lab-wise-bookings?filter=...
router.get("/dashboard/lab-wise-bookings", superAdminController.getLabWiseBookings);

// GET /api/super-admin/labs?page=1&limit=10&search=abc&status=active|inactive
router.get("/labs", superAdminController.getLabs);

// POST /api/super-admin/labs - register a new lab
router.post("/labs", superAdminController.addLab);

// GET /api/super-admin/labs/:labId?filter=... - lab details with counts
router.get("/labs/:labId", superAdminController.getLabDetails);

// GET /api/super-admin/labs/:labId/counts?filter=...
router.get("/labs/:labId/counts", superAdminController.getLabCounts);

// PATCH /api/super-admin/labs/:labId/status - body: { isActive: true|false }
router.patch("/labs/:labId/status", superAdminController.updateLabStatus);

module.exports = router;
