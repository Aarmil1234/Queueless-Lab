const { Responses } = require("../../utils/responses");
const { executeQuery } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Patient = require("../../models/patient");
const Report = require("../../models/reports");

const addPatientDb = async (data) => {
    try {

        let { patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests } = data;

        const existingPatient = await Patient.findOne({ mobileNumber });
        if (existingPatient) {
            return {
                ...Responses.success,
                data: existingPatient
            };
        }

        //generate case id randonmly as of now
        const caseId = "CASE-" + Math.floor(Math.random() * 1000000);
        const patient = new Patient({ caseId, patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests });
        await patient.save();
        return {
            ...Responses.created,
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
                tests: patient.tests
            }
        };
    } catch (error) {
        console.error(error);
        return Responses.tryAgain;
    }
};

const getAllPatientDb = async () => {
    try {
        const patients = await Patient.find({});
        return patients;
    } catch (error) {
        console.error('Error in getAllPatientDb:', error);
        return [];
    }
}

const getPatientsWithPendingReportsDb = async () => {
    try {

        // Find reports that have at least one test with isReportSubmitted = false
        const reportsWithPendingTests = await Report.find({
            'testReport.isReportSubmitted': false
        }).select('patientId id');

        // Extract unique patient IDs and create a map of patientId to reportIds
        const patientIds = [...new Set(reportsWithPendingTests.map(report => report.patientId))];
        const patientReportMap = {};
        
        reportsWithPendingTests.forEach(report => {
            if (!patientReportMap[report.patientId]) {
                patientReportMap[report.patientId] = [];
            }
            patientReportMap[report.patientId].push(report.id);
        });

        // Find patients with those IDs
        const patients = await Patient.find({
            '_id': { $in: patientIds }
        });

        // Add reportIds to each patient
        const patientsWithReportIds = patients.map(patient => ({
            ...patient.toObject(),
            reportIds: patientReportMap[patient._id] || []
        }));

        return patientsWithReportIds;
    } catch (error) {
        console.error('Error in getPatientsWithPendingReportsDb:', error);
        return [];
    }
}

const getPatientsWithSubmittedReportsDb = async () => {
    try {

        const reportsWithSubmittedTests = await Report.find({
            'testReport.isReportSubmitted': true
        }).select('patientId id');

        // Extract unique patient IDs and create a map of patientId to reportIds
        const patientIds = [...new Set(reportsWithSubmittedTests.map(report => report.patientId))];
        const patientReportMap = {};
        
        reportsWithSubmittedTests.forEach(report => {
            if (!patientReportMap[report.patientId]) {
                patientReportMap[report.patientId] = [];
            }
            patientReportMap[report.patientId].push(report.id);
        });

        // Find patients with those IDs
        const patients = await Patient.find({
            '_id': { $in: patientIds }
        });

        // Add reportIds to each patient
        const patientsWithReportIds = patients.map(patient => ({
            ...patient.toObject(),
            reportIds: patientReportMap[patient._id] || []
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
