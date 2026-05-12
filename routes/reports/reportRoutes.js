const express = require('express');
const router = express.Router();
const reportController = require("../../controllers/report/reportController");
const authMiddleware = require("../../middleware/authMiddleware");

router.use(authMiddleware);

router.post('/testWise', reportController.addPatientReport);
router.post('/create', reportController.createNewReport);
router.get('/:patientId', reportController.getPatientReport);
router.get('/', reportController.getAllPatientReport);
router.get('/getSingleReport/:reportId', reportController.getReportById);
router.get('/getTestsList/:patientId/:status', reportController.getTestsListReport)

module.exports = router;