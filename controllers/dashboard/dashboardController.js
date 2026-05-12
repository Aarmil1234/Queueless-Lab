
const { sendResponse } = require("../../utils/sendResponse");
const { doctorWisePatientDb, getTotalPatientCount, testWisePatientDb, weeklyReportDataDb, cityWiseReportDataDb } = require("../../db/dashboard/dashboard")

async function doctorWisePatient(req, res) {
    try {
        const result = await doctorWisePatientDb(req.labId);
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
        const count = await getTotalPatientCount(req.labId);
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
        const count = await testWisePatientDb(req.labId);
        return sendResponse(req, res, 200, count);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function weeklyReportData(req, res) {
    try {
        const result = await weeklyReportDataDb(req.labId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function cityWiseReportData(req, res) {
    try {
        const count = await cityWiseReportDataDb(req.labId);
        return sendResponse(req, res, 200, count);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    doctorWisePatient,
    totalPatientCount,
    testWisePatient,
    weeklyReportData,
    cityWiseReportData
};
