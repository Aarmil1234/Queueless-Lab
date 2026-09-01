
const { sendResponse } = require("../../utils/sendResponse");
const { addPatientDb, getAllPatientDb, getPatientsWithPendingReportsDb, getPatientsWithSubmittedReportsDb } = require("../../db/patient/patient");
const { createNewReportDb } = require("../../db/report/report");
const { sendPatientRegistrationMessage } = require("../../services/whatsappService");

const addPatient = async (req, res) => {
    try {
        const { patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, city, mobileNumber, testReports } = req.body;
        const patientData = {
            patientName,
            gender,
            dateOfBirth,
            age,
            referredByDoctor,
            doctorContactNo,
            address,
            city,
            mobileNumber,
            testReports,
            labId: req.labId
        }
        const response = await addPatientDb(patientData);
        if (response.statusCode !== 200) {
            return sendResponse(req, res, response.statusCode, response.message);
        }

        const createdPatient = response.data;

        let responseForReport;
        if (Array.isArray(testReports) && testReports.length > 0) {
            responseForReport = await createNewReportDb(createdPatient.id, testReports, req.labId);
            if (!responseForReport?.success) {
                console.error(
                    "Failed to create report for patient",
                    createdPatient.id,
                    responseForReport?.error || responseForReport?.message
                );
            }
        }

        if (createdPatient?.mobileNumber) {
            try {
                await sendPatientRegistrationMessage(
                    createdPatient.mobileNumber,
                    patientName || createdPatient.patientName || "Patient",
                    req.labName || req.owner?.labName || "Queueless"
                );
            } catch (whatsappError) {
                console.error("Patient registration WhatsApp failed:", whatsappError.message);
            }
        }

        return sendResponse(req, res, response.statusCode, {
            message: response.message,
            ...(responseForReport && !responseForReport.success && {
                reportWarning: "Patient added, but attaching the selected test reports failed: " +
                    (responseForReport.error || responseForReport.message)
            })
        });
    } catch (e) {
        console.error(e);
        return sendResponse(req, res, 500, { Message: e.message });
    }
};

const getAllPatient = async (req, res) => {
    try {
        const result = await getAllPatientDb(req.labId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, { Message: error.message });
    }
}

const getPatientsWithPendingReports = async (req, res) => {
    try {
        const result = await getPatientsWithPendingReportsDb(req.labId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, { Message: error.message });
    }
}

const getPatientsWithSubmittedReports = async (req, res) => {
    try {
        const result = await getPatientsWithSubmittedReportsDb(req.labId);
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