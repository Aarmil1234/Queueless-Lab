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

async function weeklyReportDataDb() {
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

module.exports = {
    doctorWisePatientDb,
    getTotalPatientCount,
    testWisePatientDb,
    weeklyReportDataDb
};
