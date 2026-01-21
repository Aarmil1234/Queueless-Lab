const express = require('express');
const patientRoutes = require("./patient/patientRoutes");
const reportRoutes = require("./reports/reportRoutes");
const testRoutes = require("./tests/testRoutes");
const parameterRoute = require('./parameter/paramterRoutes');
const router = express.Router();

router.use('/patient', patientRoutes);
router.use('/report', reportRoutes);
router.use('/test', testRoutes);
router.use('/parameter', parameterRoute);

module.exports = router;