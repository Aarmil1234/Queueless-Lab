const { sendResponse } = require("../../utils/sendResponse");
const { addPatientReportDb, getAllPatientReportDB, getReportByIdDB } = require("../../db/report/report");

const addPatientReport = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { testName, testResult } = req.body;

        if (!testName || testResult === undefined) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'testName and testResult are required'
            });
        }

        const result = await addPatientReportDb({
            patientId,
            testName,
            testResult
        });

        if (result.statusCode) {
            return sendResponse(req, res, 200, {
                success: true,
                message: 'Test result added successfully',
                data: result.data
            });
        } else {
            return sendResponse(req, res, 500, {
                success: false,
                message: result.error || 'Failed to add test result'
            });
        }
    } catch (error) {
        console.error('Error in addPatientReport:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Internal server error',
            error: error.message
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

module.exports = {
    addPatientReport,
    getPatientReport,
    getAllPatientReport,
    getReportById
};
