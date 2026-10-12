const LaboratoryOwner = require("../models/laboratoryOwner");
const LaboratoryOwnerSession = require("../models/laboratoryOwnerSession");
const Patient = require("../models/patient");
const Report = require("../models/reports");
const TestReport = require("../models/testReport");

// Fields that must never leave the API (aggregate ignores `select: false`)
const HIDDEN_LAB_FIELDS = { password: 0, resetOtp: 0, resetOtpExpiry: 0, __v: 0 };

function buildDateMatch(dateRange) {
    if (!dateRange) return {};
    return { createdAt: { $gte: dateRange.start, $lte: dateRange.end } };
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Report-level and test-level counts. Report.labId is stored as a String.
async function getReportStats(match) {
    const [stats] = await Report.aggregate([
        { $match: match },
        {
            $project: {
                tests: { $size: '$testReport' },
                submitted: {
                    $size: {
                        $filter: { input: '$testReport', cond: '$$this.isReportSubmitted' }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                totalReports: { $sum: 1 },
                totalTests: { $sum: '$tests' },
                submittedTests: { $sum: '$submitted' }
            }
        }
    ]);

    const totalTests = stats ? stats.totalTests : 0;
    const submittedTests = stats ? stats.submittedTests : 0;

    return {
        totalReports: stats ? stats.totalReports : 0,
        totalTests,
        submittedTests,
        pendingTests: totalTests - submittedTests
    };
}

async function getLabsDb({ page, limit, search, status }) {
    const match = {};

    if (status === 'active') match.isActive = true;
    if (status === 'inactive') match.isActive = false;

    if (search) {
        const regex = new RegExp(escapeRegex(search), 'i');
        match.$or = [
            { labName: regex },
            { ownerName: regex },
            { email: regex },
            { mobileNumber: regex },
            { labMobileNumber: regex }
        ];
    }

    const [labs, total] = await Promise.all([
        LaboratoryOwner.aggregate([
            { $match: match },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
                $lookup: {
                    from: Patient.collection.name,
                    let: { labId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$labId', '$$labId'] } } },
                        { $count: 'count' }
                    ],
                    as: 'bookings'
                }
            },
            {
                $addFields: {
                    totalBookings: { $ifNull: [{ $arrayElemAt: ['$bookings.count', 0] }, 0] }
                }
            },
            { $project: { ...HIDDEN_LAB_FIELDS, bookings: 0 } }
        ]),
        LaboratoryOwner.countDocuments(match)
    ]);

    return {
        labs,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getLabByIdDb(labId) {
    return LaboratoryOwner.findById(labId).select('-__v');
}

async function getLabCountsDb(labId, dateRange) {
    const dateMatch = buildDateMatch(dateRange);

    const [totalBookings, reportStats, testsConfigured, activeSessions] = await Promise.all([
        Patient.countDocuments({ labId, ...dateMatch }),
        getReportStats({ labId: labId.toString(), ...dateMatch }),
        TestReport.countDocuments({ labId, delete: false }),
        LaboratoryOwnerSession.countDocuments({ ownerId: labId, isActive: true })
    ]);

    return {
        totalBookings,
        ...reportStats,
        testsConfigured,
        activeSessions
    };
}

async function getOverallCountsDb(dateRange) {
    const dateMatch = buildDateMatch(dateRange);

    const [totalLabs, activeLabs, newLabs, totalBookings, reportStats] = await Promise.all([
        LaboratoryOwner.countDocuments({}),
        LaboratoryOwner.countDocuments({ isActive: true }),
        LaboratoryOwner.countDocuments(dateMatch),
        Patient.countDocuments(dateMatch),
        getReportStats(dateMatch)
    ]);

    return {
        totalLabs,
        activeLabs,
        inactiveLabs: totalLabs - activeLabs,
        newLabs,
        totalBookings,
        ...reportStats
    };
}

// Starts from labs (not patients) so labs with no bookings are listed with 0
async function getLabWiseBookingsDb(dateRange) {
    const bookingMatch = { $expr: { $eq: ['$labId', '$$labId'] } };
    if (dateRange) {
        bookingMatch.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
    }

    return LaboratoryOwner.aggregate([
        {
            $lookup: {
                from: Patient.collection.name,
                let: { labId: '$_id' },
                pipeline: [
                    { $match: bookingMatch },
                    { $count: 'count' }
                ],
                as: 'bookings'
            }
        },
        {
            $project: {
                _id: 0,
                labId: '$_id',
                labName: 1,
                ownerName: 1,
                isActive: 1,
                totalBookings: { $ifNull: [{ $arrayElemAt: ['$bookings.count', 0] }, 0] }
            }
        },
        { $sort: { totalBookings: -1, labName: 1 } }
    ]);
}

async function createLabDb(labData) {
    const lab = new LaboratoryOwner(labData);
    await lab.save(); // Password is hashed by the pre-save hook
    return lab;
}

async function updateLabStatusDb(labId, isActive) {
    const lab = await LaboratoryOwner.findByIdAndUpdate(
        labId,
        { isActive },
        { new: true }
    ).select('-__v');

    // Log out every device so a deactivated lab can't keep using old tokens,
    // and so re-activating doesn't revive stale sessions
    if (lab && !isActive) {
        await LaboratoryOwnerSession.updateMany(
            { ownerId: labId, isActive: true },
            { isActive: false }
        );
    }

    return lab;
}

module.exports = {
    getLabsDb,
    getLabByIdDb,
    getLabCountsDb,
    getOverallCountsDb,
    getLabWiseBookingsDb,
    createLabDb,
    updateLabStatusDb
};
