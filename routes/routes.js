const express = require('express');
const patientRoutes = require("./patient/patientRoutes");
const reportRoutes = require("./reports/reportRoutes");
const parameterRoute = require('./parameter/paramterRoutes');
const dashboardRoute = require('./dashboard/dashboardRoutes');
const authRoutes = require('./auth/authRoutes');
const testRoutes = require('./test/testRoutes');
const testReportRoutes = require('./testReports/testsRoutes');
const router = express.Router();

router.use('/patient', patientRoutes);
router.use('/report', reportRoutes);
router.use('/parameter', parameterRoute);
router.use('/dashboard', dashboardRoute);
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/testreport', testReportRoutes);

module.exports = router;