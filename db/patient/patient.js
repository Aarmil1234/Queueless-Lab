const { Responses } = require("../../utils/responses");
const { executeQuery } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Patient = require("../../models/patient");
const Report = require("../../models/reports");

const addPatientDb = async (data) => {
    try {

        let { patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests, city, labId } = data;

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
        const caseId = "CASE-" + Math.floor(Math.random() * 1000000);
        const patient = new Patient({ caseId, patientName, gender, dateOfBirth, age, referredByDoctor, doctorContactNo, address, mobileNumber, tests, city, labId });
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
                tests: patient.tests,
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
            '_id': { $in: patientIds },
            labId
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

const getPatientsWithSubmittedReportsDb = async (labId) => {
    try {

        const reportsWithSubmittedTests = await Report.find({
            'testReport.isReportSubmitted': true,
            labId
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
            '_id': { $in: patientIds },
            labId
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
