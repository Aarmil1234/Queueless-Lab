const express = require('express');
const router = express.Router();
const patientController = require("../../controllers/patient/patientController");
const authMiddleware = require("../../middleware/authMiddleware");

router.use(authMiddleware);

router.post('/', patientController.addPatient);
router.get('/getAllPatient', patientController.getAllPatient);
router.get('/pendingReportPatient', patientController.getPatientsWithPendingReports);
router.get('/submittedReportPatient', patientController.getPatientsWithSubmittedReports);

module.exports = router;