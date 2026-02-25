const express = require('express');
const router = express.Router();
const dashboardController = require("../../controllers/dashboard/dashboardController");

router.get('/doctorWisePatient', dashboardController.doctorWisePatient);
router.get('/totalPatientCount', dashboardController.totalPatientCount);
router.get('/testWisePatient', dashboardController.testWisePatient);
router.get('/weeklyReportData', dashboardController.weeklyReportData);
router.get('/cityWiseReportData', dashboardController.cityWiseReportData)


module.exports = router;