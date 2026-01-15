const { Responses } = require("../../utils/responses");
const { executeQuery } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Patient = require("../../models/patient");

const addPatientDb = async (data) => {
    try {
        let { patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests } = data;
        //generate case id randonmly as of now
        const caseId = "CASE-" + Math.floor(Math.random() * 1000000);
        const patient = new Patient({ caseId, patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests });
        await patient.save();
        return Responses.success;
    } catch (error) {
        console.error(error);
        return Responses.tryAgain;
    }
};

module.exports = {
    addPatientDb
};
