const mongoose = require('mongoose');
const { Responses } = require("../../utils/responses");
const Report = require("../../models/reports");
const Patient = require("../../models/patient");
const Parameter = require("../../models/parameter");
const ParameterSubCategory = require("../../models/parameterSubCategoryModel");
const Test = require("../../models/test");

const addPatientReportDb = async (data) => {
    try {
        const { reportId, testId, testResult, labId, testParameters, tests } = data;

        const normalizeTestParameters = async (incomingParameters = []) => {
            if (!Array.isArray(incomingParameters)) {
                return [];
            }

            const normalized = [];
            for (const parameter of incomingParameters) {
                if (!parameter?.parameterId) {
                    continue;
                }

                if (!mongoose.Types.ObjectId.isValid(parameter.parameterId)) {
                    continue;
                }

                const existingParameter = await Parameter.findOne({
                    _id: parameter.parameterId,
                    delete: false,
                    isActive: true
                });

                if (!existingParameter) {
                    continue;
                }

                normalized.push({
                    ...parameter,
                    unit: parameter.unit || existingParameter.unit || ""
                });
            }

            return normalized;
        };

        // Find the existing report by reportId and labId
        let report = await Report.findOne({ _id: reportId, labId });

        if (!report) {
            return {
                success: false,
                message: 'Report not found'
            };
        }

        const incomingTests = Array.isArray(tests) ? tests : [];

        if (incomingTests.length > 0) {
            for (const incomingTest of incomingTests) {
                const incomingTestId = incomingTest?.testId;

                if (!incomingTestId || !mongoose.Types.ObjectId.isValid(incomingTestId)) {
                    return {
                        success: false,
                        message: 'Each test entry must include a valid testId'
                    };
                }

                const testToUpdate = report.testReport.find(test => test._id.toString() === incomingTestId.toString());

                if (!testToUpdate) {
                    return {
                        success: false,
                        message: 'Test not found in report'
                    };
                }

                if (incomingTest?.testResult && typeof incomingTest.testResult === 'object') {
                    const resultMap = new Map(Object.entries(incomingTest.testResult));
                    testToUpdate.testResult = resultMap;
                }

                if (Array.isArray(incomingTest?.testParameters)) {
                    const normalizedParameters = await normalizeTestParameters(incomingTest.testParameters);

                    for (const tp of normalizedParameters) {
                        if (tp?.subCategoryId) {
                            const subCategory = await ParameterSubCategory.findOne({
                                _id: tp.subCategoryId,
                                parameterId: tp.parameterId,
                                delete: false,
                                isActive: true
                            });

                            if (!subCategory) {
                                continue;
                            }
                        }
                    }

                    testToUpdate.testParameters = normalizedParameters;
                }

                if (incomingTest?.testName) {
                    testToUpdate.testName = incomingTest.testName;
                }

                testToUpdate.isReportSubmitted = true;
            }

            await report.save();

            return {
                ...Responses.success,
                data: report
            };
        }

        if (!testId) {
            return {
                success: false,
                message: 'testId is required'
            };
        }

        const testToUpdate = report.testReport.find(test => test._id.toString() === testId);

        if (!testToUpdate) {
            return {
                success: false,
                message: 'Test not found in report'
            };
        }

        if (testResult) {
            const resultMap = new Map(Object.entries(testResult));
            testToUpdate.testResult = resultMap;
        }

        if (testParameters && Array.isArray(testParameters)) {
            const normalizedParameters = await normalizeTestParameters(testParameters);

            for (const tp of normalizedParameters) {
                if (tp.subCategoryId) {
                    const subCategory = await ParameterSubCategory.findOne({
                        _id: tp.subCategoryId,
                        parameterId: tp.parameterId,
                        delete: false,
                        isActive: true
                    });

                    if (!subCategory) {
                        continue;
                    }
                }
            }

            testToUpdate.testParameters = normalizedParameters;
        }

        testToUpdate.isReportSubmitted = true;
        await report.save();

        return {
            ...Responses.success,
            data: report
        };

    } catch (error) {
        console.error('Error in addPatientReportDb:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

async function getAllPatientReportDB(labId) {
    try {
        // First, get all reports with non-empty testReport for specific lab
        const reports = await Report.find({
            labId,
            // Match documents where testReport exists and is not empty
            $and: [
                { testReport: { $exists: true } },
                { testReport: { $ne: new Map() } }
            ]
        }).lean();

        // Get all unique patient IDs
        const patientIds = [...new Set(reports.map(r => r.patientId))];

        // Get all patients in a single query
        const patients = await Patient.find({
            _id: { $in: patientIds }
        });

        // Create a map of patientId to patient details for quick lookup
        const patientMap = new Map();
        patients.forEach(patient => {
            patientMap.set(patient._id.toString(), {
                patientId: patient._id,
                patientName: patient.patientName,
                mobileNumber: patient.mobileNumber,
                referredBy: patient.referredByDoctor
            });
        });

        // Combine the data
        const result = reports.map(report => {
            // Convert testReport Map to object if it's a Map
            let testReport = {};
            if (report.testReport && report.testReport instanceof Map) {
                testReport = Object.fromEntries(report.testReport);
            } else if (report.testReport) {
                testReport = report.testReport;
            }

            return {
                _id: report._id.toString(),
                patientId: report.patientId.toString(),
                testReport: testReport,
                createdAt: report.createdAt,
                updatedAt: report.updatedAt,
                __v: report.__v,
                patientDetails: patientMap.get(report.patientId.toString()) || {
                    patientName: 'Unknown',
                    mobileNumber: 'N/A',
                    referredBy: 'N/A'
                }
            };
        });

        return {
            ...Responses.success,
            data: result
        };
    } catch (error) {
        console.error('Error in getAllPatientReportDB:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
}

async function getReportByIdDB(reportId, labId) {
    try {
        const report = await Report.findOne({ _id: reportId, labId });

        if (!report) {
            return [];
        }

        // Fetch patient details including referredByDoctor
        const patient = await Patient.findById(report.patientId);

        if (!patient) {
            return [];
        }

        // Get the report as a plain object
        const reportObject = report.toObject();

        // Convert the testReport Map to a plain object if it exists
        let testReport = {};
        if (reportObject.testReport && reportObject.testReport instanceof Map) {
            testReport = Object.fromEntries(reportObject.testReport);
        } else if (reportObject.testReport) {
            // If it's already an object, use it as is
            testReport = reportObject.testReport;
        }

        // Create a new object with properly serialized fields
        const result = {
            _id: reportObject._id.toString(),
            patientId: reportObject.patientId.toString(),
            testReport: testReport,  // Now properly handling both Map and plain object cases
            createdAt: reportObject.createdAt,
            updatedAt: reportObject.updatedAt,
            __v: reportObject.__v,
            patientDetails: {
                patientName: patient.patientName,
                mobileNumber: patient.mobileNumber,
                referredBy: patient.referredByDoctor
            }
        };

        return result;
    } catch (error) {
        console.error('Error in getReportByIdDB:', error);
        return [];
    }
}

async function createNewReportDb(patientId, tests, labId) {
    try {
        // Create formatted tests array if tests are provided
        let testReport = [];
        if (Array.isArray(tests) && tests.length > 0) {
            testReport = await Promise.all(tests.map(async (testItem) => {
                const testName = typeof testItem === 'string' ? testItem : testItem.testName;
                const testId = typeof testItem === 'object' && testItem.testId ? testItem.testId : null;
                
                let testParameters = [];
                
                // If testId is provided, fetch test parameters dynamically
                if (testId) {
                    const test = await Test.findById(testId).populate('parameters');
                    if (test && test.parameters) {
                        testParameters = test.parameters.map(param => ({
                            parameterId: param._id,
                            subCategoryId: null,
                            value: null,
                            status: 'PENDING',
                            unit: param.unit || "",
                            notes: ''
                        }));
                    }
                }
                
                return {
                    testName,
                    testId,
                    testResult: {}, // Keep for backward compatibility
                    testParameters // New dynamic structure
                };
            }));
        }

        const report = new Report({
            patientId,
            labId,
            testReport
        });

        await report.save();

        return {
            ...Responses.created,
            data: report
        };
    } catch (error) {
        console.error('Error in createNewReportDb:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
}

async function getTestsListForReportDb(patientId, status, labId) {
    try {
        // Find all reports by patientId and labId
        const reports = await Report.find({ patientId, labId });

        if (!reports || reports.length === 0) {
            return [];
        }

        // Fetch patient details (using first report's patientId)
        const patient = await Patient.findById(reports[0].patientId);

        if (!patient) {
            return [];
        }

        // Collect all tests from all reports
        let allTests = [];

        // Process each report
        reports.forEach(report => {
            let filteredTests = report.testReport;
            
            if (status === 'pending') {
                filteredTests = report.testReport.filter(test => test.isReportSubmitted === false);
            } else if (status === 'submitted') {
                filteredTests = report.testReport.filter(test => test.isReportSubmitted === true);
            }

            // Add tests from this report with reportId and report date
            const testsFromThisReport = filteredTests.map(test => ({
                id: test._id ? test._id.toString() : null,
                name: test.testName,
                reportId: report._id.toString(),
                reportDate: report.createdAt
            }));

            allTests = allTests.concat(testsFromThisReport);
        });

        // Return the result with patient details in parent object
        const result = {
            patientDetails: {
                patientId: patient._id.toString(),
                patientName: patient.patientName,
                mobileNumber: patient.mobileNumber,
                referredBy: patient.referredByDoctor,
                gender: patient.gender,
                age: patient.age,
                ageType: patient.ageType,
                address: patient.address
            },
            testsList: allTests
        };

        return result;
    } catch (error) {
        console.error('Error in getTestsListForReportDb:', error);
        return [];
    }
}

module.exports = {
    addPatientReportDb,
    getAllPatientReportDB,
    getReportByIdDB,
    getTestsListForReportDb,
    createNewReportDb
};
