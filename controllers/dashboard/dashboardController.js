
const { sendResponse } = require("../../utils/sendResponse");
const { doctorWisePatientDb, getTotalPatientCount, testWisePatientDb, weeklyReportDataDb, cityWiseReportDataDb } = require("../../db/dashboard/dashboard")
const { getDateRangeFromFilter } = require("../../utils/dateFilter");

async function doctorWisePatient(req, res) {
    try {
        const dateRange = getDateRangeFromFilter(req.query.filter);
        const result = await doctorWisePatientDb(req.labId, dateRange);
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
        const dateRange = getDateRangeFromFilter(req.query.filter);
        const count = await getTotalPatientCount(req.labId, dateRange);
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
        const dateRange = getDateRangeFromFilter(req.query.filter);
        const count = await testWisePatientDb(req.labId, dateRange);
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
        const dateRange = getDateRangeFromFilter(req.query.filter);
        const result = await weeklyReportDataDb(req.labId, dateRange);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function cityWiseReportData(req, res) {
    try {
        const dateRange = getDateRangeFromFilter(req.query.filter);
        const count = await cityWiseReportDataDb(req.labId, dateRange);
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
