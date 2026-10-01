const express = require("express");

const {
  loginSuperAdmin
} = require("../controllers/superAdminController");

const router = express.Router();

router.post("/login", loginSuperAdmin);

module.exports = router;