const { sendResponse } = require("../../utils/sendResponse");
const { addPatientReportDb, getAllPatientReportDB, getReportByIdDB, getTestsListForReportDb } = require("../../db/report/report");

const addPatientReport = async (req, res) => {
    try {
        const { reportId, testId, testResult } = req.body;

        if (!testId || typeof testResult !== "object") {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'testId and testResult (object) are required'
            });
        }

        const result = await addPatientReportDb({
            reportId,
            testId,
            testResult
        });

        return sendResponse(req, res, result.statusCode, result.data);

    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
};

const getPatientReport = async (req, res) => {
    try {
        const patientId = req.params;
    } catch (error) {

    }
}

async function getAllPatientReport(req, res) {
    try {
        const result = await getAllPatientReportDB();
        return sendResponse(req, res, 200, result.data);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function getReportById(req, res) {
    try {
        const { reportId } = req.params;
        const result = await getReportByIdDB(reportId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function getTestsListReport(req, res) {
    try {
        const { patientId } = req.params;
        const result = await getTestsListForReportDb(patientId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    addPatientReport,
    getPatientReport,
    getAllPatientReport,
    getReportById,
    getTestsListReport
};
