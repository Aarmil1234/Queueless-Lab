const express = require('express');
const parameterSubCategoryController = require('../../controllers/parameterSubCategory/parameterSubCategoryController');
const authMiddleware = require("../../middleware/authMiddleware");
const router = express.Router();

router.use(authMiddleware);

router.get('/all', parameterSubCategoryController.getAllParameterSubCategories);
router.get('/:parameterId', parameterSubCategoryController.getAllParameterSubCategoriesByParameterId);
router.get('/:parameterId/:parameterSubCategoryId', parameterSubCategoryController.getSingleParameterSubCategory);
router.post('/add', parameterSubCategoryController.addParameterSubCategory);
router.put('/:parameterSubCategoryId', parameterSubCategoryController.updateParameterSubCategory);
router.delete('/:parameterSubCategoryId', parameterSubCategoryController.deleteParameterSubCategory);

module.exports = router;
