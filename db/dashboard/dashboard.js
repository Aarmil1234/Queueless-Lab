const { Responses } = require("../../utils/responses");
const Report = require("../../models/reports");
const Patient = require("../../models/patient");
const mongoose = require('mongoose');

async function doctorWisePatientDb(labId, dateRange) {
    try {
        const match = { labId };
        if (dateRange) {
            match.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
        }
        const result = await Patient.aggregate([
            { $match: match },
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

async function getTotalPatientCount(labId, dateRange) {
    try {
        const match = { labId };
        if (dateRange) {
            match.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
        }
        const count = await Patient.countDocuments(match);
        return count;
    } catch (error) {
        console.error('Error in getTotalPatientCount:', error);
        throw error;
    }
}

async function testWisePatientDb(labId, dateRange) {
    try {
        const matchStage = {
            $expr: {
                $eq: [
                    { $toString: "$labId" },
                    labId.toString()
                ]
            }
        };
        if (dateRange) {
            matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
        }

        const result = await Report.aggregate([
            {
                $match: matchStage
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

async function weeklyReportDataDb(labId, dateRange) {
    try {
        let start, end;

        if (dateRange) {
            start = dateRange.start;
            end = dateRange.end;
        } else {
            const today = new Date();

            // Get current day index (0=Sun, 1=Mon, ...)
            const dayIndex = today.getDay();

            // Calculate Monday of current week
            const diffToMonday = dayIndex === 0 ? -6 : 1 - dayIndex;

            start = new Date(today);
            start.setDate(today.getDate() + diffToMonday);
            start.setHours(0, 0, 0, 0);

            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

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
                        $gte: start,
                        $lte: end
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

async function cityWiseReportDataDb(labId, dateRange) {
    try {
        const matchStage = {
            $expr: {
                $eq: [
                    { $toString: "$labId" },
                    labId.toString()
                ]
            }
        };
        if (dateRange) {
            matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
        }

        const result = await Report.aggregate([
            {
                $match: matchStage
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