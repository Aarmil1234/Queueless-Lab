const express = require('express');
const router = express.Router();
const testController = require("../../controllers/test/testController");

router.get('', testController.getAllTestList);

module.exports = router;