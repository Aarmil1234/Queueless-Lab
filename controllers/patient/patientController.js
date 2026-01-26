
const { sendResponse } = require("../../utils/sendResponse");
const { addPatientDb } = require("../../db/patient/patient");

//create login with email and password and jwt token
const addPatient = async (req, res) => {
    try {
        const { patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests } = req.body;
        const patientData = {
           patientName,
           gender,  
           dateOfBirth,
           age,
           referredByDoctor,
           doctorContactNo,
           address,
           mobileNumber,
           tests
        }
        const info = await addPatientDb(patientData);
        return sendResponse(req, res, info.statusCode, info.clientMessage);
    } catch (e) {
        console.error(e);
        return sendResponse(req, res, 500, { Message: e.message });
    }
};

module.exports = {
    addPatient
};
