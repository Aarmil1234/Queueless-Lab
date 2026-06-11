const express = require('express');
const router = express.Router();
const reportController = require("../../controllers/report/reportController");
const authMiddleware = require("../../middleware/authMiddleware");
const multer = require('multer');
const { storage } = require('../../cloudinary/index');

const uploadDoc = multer({ storage });

router.use(authMiddleware);

router.post('/testWise', uploadDoc.single('document'), reportController.addPatientReport);
router.post('/create', reportController.createNewReport);
router.get('/getSingleReport/:reportId', reportController.getReportById);
router.get('/getTestsList/:patientId/:status', reportController.getTestsListReport);
router.get('/:patientId', reportController.getPatientReport);
router.get('/', reportController.getAllPatientReport);

module.exports = router;