const express = require('express');
const router = express.Router();
const reportController = require("../../controllers/report/reportController");

router.post('/:patientId', reportController.addPatientReport);
router.get('/:patientId', reportController.getPatientReport);
router.get('/', reportController.getAllPatientReport);
router.get('/getSingleReport/:reportId', reportController.getReportById);

module.exports = router;