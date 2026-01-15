const express = require('express');
const router = express.Router();
const patientController = require("../../controllers/patient/patientController");

router.post('/', patientController.addPatient);

module.exports = router;