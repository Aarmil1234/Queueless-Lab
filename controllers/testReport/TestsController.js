const { sendResponse } = require("../../utils/sendResponse");
const {
    addTestReportDb,
    updateTestReportDb,
    getAllTestReportsDb,
    getTestReportByIdDb,
    getTestReportParametersWithSubCategoriesDb,
    deleteTestReportDb
} = require("../../db/testReport/TestReport");

const sanitizeTestReportPayload = (payload = {}) => ({
    ...(payload.code && { code: payload.code.trim().toUpperCase() }),
    ...(payload.testName && { testName: payload.testName.trim() }),
    ...(payload.category && { category: payload.category.trim() }),
    ...(payload.isActive !== undefined && { isActive: payload.isActive })
});

async function addTestReport(req, res) {
    try {
        const testReportData = sanitizeTestReportPayload(req.body);
        testReportData.labId = req.labId;
        const response = await addTestReportDb(testReportData);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        console.log("==============================");
        
        return sendResponse(req, res, 500, error.message);
    }
};

/**
 * UPDATE TEST REPORT
 */
async function updateTestReport(req, res) {
    try {
        const { id } = req.params;
        const updateData = sanitizeTestReportPayload(req.body);
        const response = await updateTestReportDb(id, updateData, req.labId);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
};

async function getAllTestReports(req, res) {
    try {
        const response = await getAllTestReportsDb(req.labId);
        if (response.length > 0) {
            return sendResponse(req, res, 200, response);
        }
        return sendResponse(req, res, 404, "No test reports found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function getTestReportById(req, res) {
    try {
        const { id } = req.params;
        const response = await getTestReportByIdDb(id, req.labId);
        if (response.length > 0 && response[0]) {
            return sendResponse(req, res, 200, response);
        }
        return sendResponse(req, res, 404, "Test report not found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function getTestReportParametersWithSubCategories(req, res) {
    try {
        const { testReportId } = req.params;
        const response = await getTestReportParametersWithSubCategoriesDb(testReportId, req.labId);

        if (response.statusCode && response.statusCode >= 400) {
            return sendResponse(req, res, response.statusCode, {
                success: false,
                message: response.message || 'Test report not found'
            });
        }

        return sendResponse(req, res, 200, response.data);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function deleteTestReport(req, res) {
    try {
        const { id } = req.params;
        const response = await deleteTestReportDb(id, req.labId);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

module.exports = {
    addTestReport,
    updateTestReport,
    getAllTestReports,
    getTestReportById,
    getTestReportParametersWithSubCategories,
    deleteTestReport
};
