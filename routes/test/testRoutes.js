const express = require('express');
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const {
    getAllTestList,
    createTest,
    getAllTests,
    getTestById,
    getTestParametersWithSubCategories
} = require('../../controllers/test/testController');

router.use(authMiddleware);

// Legacy route - keep for backward compatibility
router.get('/test-list', getAllTestList);

// New dynamic test management routes
router.post('/create', createTest);
router.get('/all', getAllTests);
router.get('/:testId', getTestById);
router.get('/:testId/parameters', getTestParametersWithSubCategories);

module.exports = router;
