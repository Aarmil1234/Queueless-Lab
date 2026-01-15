const { Responses } = require("../../utils/responses");
const Report = require("../../models/reports");
const Patient = require("../../models/patient");

const addPatientReportDb = async (data) => {
    try {
        const { patientId, testName, testResult } = data;

        // Find existing report for the patient
        let report = await Report.findOne({ patientId });

        if (!report) {
            // If no report exists, create a new one with a Map
            report = new Report({
                patientId,
                testReport: new Map()
            });
        }

        // Convert testReport to a Map if it's not already
        if (!(report.testReport instanceof Map)) {
            report.testReport = new Map(Object.entries(report.testReport || {}));
        }

        // Set the test result in the Map
        report.testReport.set(testName, testResult);

        // Convert the Map back to an object for storage
        report.testReport = Object.fromEntries(report.testReport);

        // Save the updated report
        await report.save();

        return {
            ...Responses.success,
            data: report
        };
    } catch (error) {
        console.error('Error in addPatientReportDb:', error);
        return {
            ...Responses.tryAlso,
            error: error.message
        };
    }
};

async function getAllPatientReportDB() {
    try {
        // Find all patients with their test arrays
        const patients = await Patient.find({ 'tests': { $exists: true, $not: { $size: 0 } } });

        // Process each patient's tests
        const allTestResults = patients.flatMap(patient => {
            return patient.tests.map(test => ({
                patientId: patient._id.toString(),
                patientName: patient.patientName,
                mobileNumber: patient.mobileNumber,
                caseId: patient.caseId,
                testName: test
            }));
        });

        return {
            ...Responses.success,
            data: allTestResults
        };
    } catch (error) {
        console.error('Error in getAllPatientReportDB:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
}

async function getReportByIdDB(reportId){
    try {
        const report = await Report.findById(reportId);
        return report;
    } catch (error) {
        return [];
    }
}

module.exports = {
    addPatientReportDb,
    getAllPatientReportDB,
    getReportByIdDB
};
