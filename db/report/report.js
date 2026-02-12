const { Responses } = require("../../utils/responses");
const Report = require("../../models/reports");
const Patient = require("../../models/patient");

const addPatientReportDb = async (data) => {
    try {
        const { reportId, testId, testResult } = data;

        // Find the existing report by reportId
        let report = await Report.findById(reportId);

        if (!report) {
            return {
                success: false,
                message: 'Report not found'
            };
        }

        // Convert object to Map
        const resultMap = new Map(Object.entries(testResult));

        // Find the test with matching testId and update its testResult
        const testToUpdate = report.testReport.find(test => test._id.toString() === testId);

        if (testToUpdate) {
            testToUpdate.testResult = resultMap;
        } else {
            return Responses.notFound;
        }

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

async function getAllPatientReportDB() {
    try {
        // First, get all reports with non-empty testReport
        const reports = await Report.find({
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

async function getReportByIdDB(reportId) {
    try {
        const report = await Report.findById(reportId);

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

async function getTestsListForReportDb(patientId) {
    try {
        // Find the report by reportId
        const report = await Report.findOne({ patientId });

        if (!report) {
            return [];
        }

        // Fetch patient details
        const patient = await Patient.findById(report.patientId);

        if (!patient) {
            return [];
        }

        // Extract test list with id and name from testReport array
        const testsList = report.testReport.map((test, index) => ({
            id: test._id ? test._id.toString() : index.toString(),
            name: test.testName
        }));

        // Return the result with patient details in parent object
        const result = {
            reportId: report.id,
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
            testsList: testsList
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
    getTestsListForReportDb
};
