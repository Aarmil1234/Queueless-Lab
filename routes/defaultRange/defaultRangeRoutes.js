const express = require('express');
const defaultParameterRangeController = require('../../controllers/defaultParameterRange/defaultParameterRangeController');
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");

router.use(authMiddleware);

router.get('/:parameterId', defaultParameterRangeController.getAllParameterRangesByParameterId);

router.get('/:parameterId/subcategory/:subCategoryId', defaultParameterRangeController.getParameterRangesByParameterAndSubCategory);
router.get('/:parameterId/subcategory/:subCategoryId/:parameterRangeId', defaultParameterRangeController.getSpecificParameterRangeByParameterSubCategoryAndRangeId);
router.get('/:parameterId/:parameterRangeId', defaultParameterRangeController.getSingleParameterRange);
router.post('/add', defaultParameterRangeController.addDefaultParameterRange);
router.put('/:parameterRangeId', defaultParameterRangeController.updateDefaultParameterRange);
router.delete('/:parameterRangeId', defaultParameterRangeController.deleteParameterRange);

module.exports = router;