// /routes/parameterSubCategoryRoutes.js
const express = require('express');
const router = express.Router();
const parameterSubCategoryController = require('../controllers/parameterSubCategoryController');

router.post('/', parameterSubCategoryController.create);
router.get('/', parameterSubCategoryController.getAll);
router.get('/by-parameter-code/:parameterCode', parameterSubCategoryController.getByParameterCode);
router.get('/:id', parameterSubCategoryController.getById);
router.put('/:id', parameterSubCategoryController.update);
router.delete('/:id', parameterSubCategoryController.delete);

module.exports = router;
