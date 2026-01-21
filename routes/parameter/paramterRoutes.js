const express = require('express');
const defaultRangeRoutes = require('../defaultRange/defaultRangeRoutes');
const parameterController = require('../../controllers/parameter/parameterController');
const hospitalCustomParameterRangeRoutes = require('../hospitalCustomParameterRange/hospitalCustomParameterRangeRoutes');
const router = express.Router();

router.get('/', parameterController.getAllParameters);
router.get('/:id', parameterController.getParameterById);
router.post('/add', parameterController.addParameter);
router.put('/:id', parameterController.updateParameter);
router.delete('/:id', parameterController.deleteParameter);

router.use('/defaultParameter', defaultRangeRoutes);
router.use('/hospitalParameter', hospitalCustomParameterRangeRoutes);

module.exports = router;