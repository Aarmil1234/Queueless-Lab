const { sendResponse } = require("../../utils/sendResponse");
const mongoose = require('mongoose');
const { addPatientReportDb, getAllPatientReportDB, getReportByIdDB, getTestsListForReportDb, createNewReportDb } = require("../../db/report/report");
const { validateParameterRanges, updateParameterStatus } = require("../../utils/parameterRangeValidator");
const Report = require("../../models/reports");

const createNewReport = async (req, res) => {
    try {
        const { patientId, tests } = req.body;
        const labId = req.labId;
        
        // Support both string array and object array for tests
        if (tests && Array.isArray(tests)) {
            for (const test of tests) {
                if (typeof test === 'object' && test.testId) {
                    // Validate testId format if provided
                    if (!mongoose.Types.ObjectId.isValid(test.testId)) {
                        return sendResponse(req, res, 400, {
                            success: false,
                            message: 'Invalid testId format'
                        });
                    }
                }
            }
        }
        
        const result = await createNewReportDb(patientId, tests, labId);
        
        return sendResponse(req, res, result.statusCode, result.data);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

const addPatientReport = async (req, res) => {
    try {
        const { reportId, testId, testResult, testParameters } = req.body;
        const labId = req.labId;

        if (!testId) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'testId is required'
            });
        }

        // Allow either traditional testResult or new testParameters
        if (!testResult && !testParameters) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Either testResult or testParameters must be provided'
            });
        }

        if (testResult && typeof testResult !== "object") {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'testResult must be an object'
            });
        }

        if (testParameters && !Array.isArray(testParameters)) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'testParameters must be an array'
            });
        }

        // Get patient ID from report for range validation
        const report = await Report.findById(reportId);
        if (!report) {
            return sendResponse(req, res, 404, {
                success: false,
                message: 'Report not found'
            });
        }

        // Validate parameter ranges if testParameters are provided
        if (testParameters && testParameters.length > 0) {
            const validation = await validateParameterRanges(testParameters, report.patientId);
            
            if (!validation.isValid) {
                return sendResponse(req, res, 400, {
                    success: false,
                    message: 'Parameter values are outside normal ranges',
                    errors: validation.errors,
                    warnings: validation.warnings
                });
            }

            // Update parameter status based on ranges
            const updatedParameters = await updateParameterStatus(testParameters, report.patientId);
            
            // Use updated parameters with status
            const result = await addPatientReportDb({
                reportId,
                testId,
                testResult,
                labId,
                testParameters: updatedParameters
            });

            return sendResponse(req, res, result.statusCode, {
                ...result.data,
                warnings: validation.warnings
            });
        }

        const result = await addPatientReportDb({
            reportId,
            testId,
            testResult,
            labId,
            testParameters
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
        const { patientId } = req.params;
        const labId = req.labId;
        
        const result = await getAllPatientReportDB(labId);
        return sendResponse(req, res, 200, result.data);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function getAllPatientReport(req, res) {
    try {
        const { labId } = req.body;
        
        if (!labId) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'labId is required'
            });
        }
        
        const result = await getAllPatientReportDB(labId);
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
        const labId = req.labId;
        
        const result = await getReportByIdDB(reportId, labId);
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
        const { patientId, status } = req.params;
        const labId = req.labId;
        
        const result = await getTestsListForReportDb(patientId, status, labId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createNewReport,
    addPatientReport,
    getPatientReport,
    getAllPatientReport,
    getReportById,
    getTestsListReport
};
