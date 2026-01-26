const { Responses } = require("../../utils/responses");
const Report = require("../../models/reports");
const Patient = require("../../models/patient");

async function doctorWisePatientDb() {
    try {
        const result = await Patient.aggregate([
            {
                $group: {
                    _id: {
                        doctorName: '$referredByDoctor',
                        doctorContact: '$doctorContactNo'
                    },
                    patientCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    doctorName: '$_id.doctorName',
                    doctorContact: '$_id.doctorContact',
                    patientCount: 1
                }
            },
            { $sort: { patientCount: -1 } }
        ]);
        return result;
    } catch (error) {
        console.error('Error in getPatientsPerDoctor:', error);
        throw error;
    }
}

async function getTotalPatientCount() {
    try {
        const count = await Patient.countDocuments({});
        return count;
    } catch (error) {
        console.error('Error in getTotalPatientCount:', error);
        throw error;
    }
}

async function testWisePatientDb() {
    try {
        const result = await Report.aggregate([
            {
                $project: {
                    testNames: { $objectToArray: '$testReport' }
                }
            },
            { $unwind: '$testNames' },
            {
                $group: {
                    _id: '$testNames.k',
                    patientCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    testName: '$_id',
                    patientCount: 1
                }
            },
            { $sort: { patientCount: -1 } }
        ]);
        return result;
    } catch (error) {
        console.error('Error in testWisePatientDb:', error);
        throw error;
    }
}

module.exports = {
    doctorWisePatientDb,
    getTotalPatientCount,
    testWisePatientDb
};
