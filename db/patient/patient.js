const { Responses } = require("../../utils/responses");
const { executeQuery } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Patient = require("../../models/patient");
const Report = require("../../models/reports");
const { resolveParameterRanges } = require("../../utils/parameterRangeResolver");
const Lab = require("../../models/laboratoryOwner");

const generateCaseId = async (labId) => {
    const lab = await Lab.findById(labId);

    if (!lab) {
        throw new Error("Lab not found");
    }

    // First 3 letters of lab name
    const prefix = lab.labName
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase();

    // Current IST date
    const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    })
        .format(new Date())
        .replace(/-/g, "");

    // Find today's patients for this lab
    const patients = await Patient.find({
        labId,
        caseId: new RegExp(`^${prefix}${date}\\d+$`)
    }).sort({ caseId: -1 });

    let sequence = 1;

    if (patients.length > 0) {
        const latestCaseId = patients[0].caseId;

        // Remove prefix + date
        const lastNumber = latestCaseId.replace(`${prefix}${date}`, "");

        sequence = Number(lastNumber) + 1;
    }

    return `${prefix}${date}${String(sequence).padStart(3, "0")}`;
};

const addPatientDb = async (data) => {
    try {

        let { patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, testReports, city, labId } = data;

        // const existingPatient = await Patient.findOne({ mobileNumber, labId });
        // if (existingPatient) {
        //     return {
        //         ...Responses.success,
        //         data: existingPatient
        //     };
        //     // return {
        //     //     success: false,
        //     //     message: "Patient with this mobile number already exists"
        //     // };
        // }

        //generate case id randonmly as of now
        // const caseId = "CASE-" + Math.floor(Math.random() * 1000000);
        const caseId = await generateCaseId(labId);

        const patient = new Patient({ caseId, patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, testReports, city, labId });
        await patient.save();
        return {
            ...Responses.success,
            data: {
                id: patient._id,
                caseId: patient.caseId,
                patientName: patient.patientName,
                gender: patient.gender,
                dateOfBirth: patient.dateOfBirth,
                age: patient.age,
                referredByDoctor: patient.referredByDoctor,
                doctorContactNo: patient.doctorContactNo,
                address: patient.address,
                mobileNumber: patient.mobileNumber,
                testReports: patient.testReports,
                city: patient.city
            }
        };
    } catch (error) {
        console.error(error);
        return Responses.tryAgain;
    }
};

const getAllPatientDb = async (labId) => {
    try {
        const patients = await Patient.find({ labId });
        return patients;
    } catch (error) {
        console.error('Error in getAllPatientDb:', error);
        return [];
    }
}

const getPatientsWithPendingReportsDb = async (labId) => {
    try {

        // Find reports that have at least one test with isReportSubmitted = false
        const reportsWithPendingTests = await Report.find({
            'testReport.isReportSubmitted': false,
            labId
        }).select('patientId testReport');

        // Extract unique patient IDs and create a map of patientId to reportIds/pendingTests
        const patientIds = [...new Set(reportsWithPendingTests.map(report => report.patientId))];
        const patientReportMap = {};

        reportsWithPendingTests.forEach(report => {
            if (!patientReportMap[report.patientId]) {
                patientReportMap[report.patientId] = { reportIds: [], pendingTests: [] };
            }
            patientReportMap[report.patientId].reportIds.push(report.id);

            report.testReport
                .filter(test => test.isReportSubmitted === false)
                .forEach(test => {
                    patientReportMap[report.patientId].pendingTests.push({
                        reportId: report.id,
                        testReportId: test.testReportId,
                        testName: test.testName
                    });
                });
        });

        // Find patients with those IDs
        const patients = await Patient.find({
            '_id': { $in: patientIds },
            labId
        });

        // Add reportIds and pending test names to each patient
        const patientsWithReportIds = patients.map(patient => ({
            ...patient.toObject(),
            reportIds: patientReportMap[patient._id]?.reportIds || [],
            pendingTests: patientReportMap[patient._id]?.pendingTests || []
        }));

        return patientsWithReportIds;
    } catch (error) {
        console.error('Error in getPatientsWithPendingReportsDb:', error);
        return [];
    }
}

const getPatientsWithSubmittedReportsDb = async (labId) => {
    try {

        const reportsWithSubmittedTests = await Report.find({
            'testReport.isReportSubmitted': true,
            labId
        }).select('patientId testReport');

        // Extract unique patient IDs and create a map of patientId to reportIds/submittedTests
        const patientIds = [...new Set(reportsWithSubmittedTests.map(report => report.patientId))];
        const patientReportMap = {};

        reportsWithSubmittedTests.forEach(report => {
            if (!patientReportMap[report.patientId]) {
                patientReportMap[report.patientId] = { reportIds: [], submittedTests: [] };
            }
            patientReportMap[report.patientId].reportIds.push(report.id);

            report.testReport
                .filter(test => test.isReportSubmitted === true)
                .forEach(test => {
                    patientReportMap[report.patientId].submittedTests.push({
                        reportId: report.id,
                        testReportId: test.testReportId,
                        testName: test.testName,
                        // Raw params kept only to resolve reference ranges once the
                        // patient (age/gender) is known below; stripped before returning.
                        _rawParameters: test.testParameters || []
                    });
                });
        });

        // Find patients with those IDs
        const patients = await Patient.find({
            '_id': { $in: patientIds },
            labId
        });

        // Add reportIds and submitted test names to each patient
        const patientsWithReportIds = await Promise.all(patients.map(async patient => {
            const mapEntry = patientReportMap[patient._id] || { reportIds: [], submittedTests: [] };

            const submittedTests = await Promise.all(mapEntry.submittedTests.map(async ({ _rawParameters, ...rest }) => ({
                ...rest,
                // Reference range per parameter, resolved for this patient's age/gender
                testParameters: await resolveParameterRanges(_rawParameters, patient)
            })));

            return {
                ...patient.toObject(),
                reportIds: mapEntry.reportIds,
                submittedTests
            };
        }));

        return patientsWithReportIds;
    } catch (error) {
        console.error('Error in getPatientsWithSubmittedReportsDb:', error);
        return [];
    }
}

module.exports = {
    addPatientDb,
    getAllPatientDb,
    getPatientsWithPendingReportsDb,
    getPatientsWithSubmittedReportsDb
};
