const express = require('express');
const defaultRangeRoutes = require('../defaultRange/defaultRangeRoutes');
const parameterController = require('../../controllers/parameter/parameterController');
const hospitalCustomParameterRangeRoutes = require('../hospitalCustomParameterRange/hospitalCustomParameterRangeRoutes');
const subCategoryController = require('../parameterSubCategory/parameterSubCategoryRoutes');
const authMiddleware = require("../../middleware/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.get('/', parameterController.getAllParameters);
router.get('/byTestReport/:testReportId', parameterController.getParametersByTestReportId);
router.get('/:id', parameterController.getParameterById);
router.post('/add', parameterController.addParameter);
router.put('/:id', parameterController.updateParameter);
router.delete('/:id', parameterController.deleteParameter);

router.use('/defaultParameter', defaultRangeRoutes);
router.use('/subCategory', subCategoryController);
router.use('/hospitalParameter', hospitalCustomParameterRangeRoutes);

module.exports = router;