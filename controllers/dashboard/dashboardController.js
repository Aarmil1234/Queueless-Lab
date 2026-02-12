
const { sendResponse } = require("../../utils/sendResponse");
const { doctorWisePatientDb, getTotalPatientCount, testWisePatientDb, weeklyReportDataDb } = require("../../db/dashboard/dashboard")

async function doctorWisePatient(req, res) {
    try {
        const result = await doctorWisePatientDb();
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function totalPatientCount(req, res) {
    try {
        const count = await getTotalPatientCount();
        return sendResponse(req, res, 200, {
            success: true,
            data: {
                totalPatients: count
            }
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function testWisePatient(req, res) {
    try {
        const count = await testWisePatientDb();
        return sendResponse(req, res, 200, {
            success: true,
            data: {
                totalPatients: count
            }
        });
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function weeklyReportData(req, res) {
    try {
        const result = await weeklyReportDataDb();
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

module.exports = {
    doctorWisePatient,
    totalPatientCount,
    testWisePatient,
    weeklyReportData
};
