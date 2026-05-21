const { Responses } = require("../../utils/responses");
const Report = require("../../models/reports");
const Patient = require("../../models/patient");
const mongoose = require('mongoose');

async function doctorWisePatientDb(labId) {
    try {
        const result = await Patient.aggregate([
            { $match: { labId } },
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

async function getTotalPatientCount(labId) {    
    try {
        const count = await Patient.countDocuments({ labId });
        return count;
    } catch (error) {
        console.error('Error in getTotalPatientCount:', error);
        throw error;
    }
}

async function testWisePatientDb(labId) {
    try {
        const data = await Report.find({ labId });
        console.log("find result:", data.length);

        const result = await Report.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $toString: "$labId" },
                            labId.toString()
                        ]
                    }
                }
            },
            { $unwind: "$testReport" },
            {
                $group: {
                    _id: "$testReport.testName",
                    patientCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    testName: "$_id",
                    patientCount: 1
                }
            },
            { $sort: { patientCount: -1 } }
        ]);

        return result;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function weeklyReportDataDb(labId) {
    try {
        const today = new Date();

        // Get current day index (0=Sun, 1=Mon, ...)
        const dayIndex = today.getDay();

        // Calculate Monday of current week
        const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;

        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);

        // Today end time
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Aggregate report count grouped by day
        const result = await Report.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $toString: "$labId" },
                            labId.toString()
                        ]
                    },
                    createdAt: {
                        $gte: monday,
                        $lte: endOfToday
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Initialize all days Monday → Sunday as 0
        const response = {
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0
        };

        // Mongo $dayOfWeek returns:
        // 1=Sunday, 2=Monday, ... 7=Saturday
        const dayMap = {
            1: "sunday",
            2: "monday",
            3: "tuesday",
            4: "wednesday",
            5: "thursday",
            6: "friday",
            7: "saturday"
        };

        result.forEach(item => {
            const dayName = dayMap[item._id];
            if (response[dayName] !== undefined) {
                response[dayName] = item.count;
            }
        });

        return response;
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function cityWiseReportDataDb(labId) {
    try {
        
        const result = await Report.aggregate([
            { 
                $match: {
                    $expr: {
                        $eq: [
                            { $toString: "$labId" },
                            labId.toString()
                        ]
                    }
                }
            },
            {
                $addFields: {
                    patientObjectId: { $toObjectId: "$patientId" }
                }
            },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'patientObjectId',
                    foreignField: '_id',
                    as: 'patientInfo'
                }
            },
            {
                $unwind: '$patientInfo'
            },
            {
                $group: {
                    _id: '$patientInfo.city',
                    reportCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    city: '$_id',
                    reportCount: 1
                }
            },
            { $sort: { reportCount: -1 } }
        ]);
        return result;
    } catch (error) {
        console.error('Error in cityWiseReportDataDb:', error);
        return [];
    }
}

module.exports = {
    doctorWisePatientDb,
    getTotalPatientCount,
    testWisePatientDb,
    weeklyReportDataDb,
    cityWiseReportDataDb
};
