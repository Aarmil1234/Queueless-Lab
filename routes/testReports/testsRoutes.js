const express = require('express');
const testReportController = require('../../controllers/testReport/TestsController');
const authMiddleware = require("../../middleware/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.get('/', testReportController.getAllTestReports);
router.get('/:id', testReportController.getTestReportById);
router.post('/add', testReportController.addTestReport);
router.put('/:id', testReportController.updateTestReport);
router.delete('/:id', testReportController.deleteTestReport);

// Parameters (with their subcategories) that belong to a given test report
router.get('/:testReportId/parameters', testReportController.getTestReportParametersWithSubCategories);

module.exports = router;