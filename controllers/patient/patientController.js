
const { sendResponse } = require("../../utils/sendResponse");
const { addPatientDb, getAllPatientDb, getPatientsWithPendingReportsDb, getPatientsWithSubmittedReportsDb } = require("../../db/patient/patient");
const reportModel = require("../../models/reports");

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
        const response = await addPatientDb(patientData);

        if (!response.statusCode) {
            return sendResponse(req, res, response.statusCode, response.message);
        }

        const createdPatient = response.data;

        // 2️⃣ Create Report Automatically
        if (Array.isArray(tests) && tests.length > 0) {

            const formattedTests = tests.map(testName => ({
                testName,
                testResult: {}  // empty result
            }));

            await reportModel.create({
                patientId: createdPatient.id,
                testReport: formattedTests
            });
        }

        return sendResponse(req, res, response.statusCode, response.message);
    } catch (e) {
        console.error(e);
        return sendResponse(req, res, 500, { Message: e.message });
    }
};

const getAllPatient = async (req, res) => {
    try {
        const result = await getAllPatientDb();
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, { Message: error.message });
    }
}

const getPatientsWithPendingReports = async (req, res) => {
    try {
        const result = await getPatientsWithPendingReportsDb();
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, { Message: error.message });
    }
}

const getPatientsWithSubmittedReports = async (req, res) => {
    try {
        const result = await getPatientsWithSubmittedReportsDb();
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, { Message: error.message });
    }
}

module.exports = {
    addPatient,
    getAllPatient,
    getPatientsWithPendingReports,
    getPatientsWithSubmittedReports
};
