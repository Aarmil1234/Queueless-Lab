const { Responses } = require("../../utils/responses");
const { executeQuery } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Patient = require("../../models/patient");
const Report = require("../../models/reports");
const { resolveParameterRanges } = require("../../utils/parameterRangeResolver");
const Lab = require("../../models/laboratoryOwner");

// const generateCaseId = async (labId) => {
//     const lab = await Lab.findById(labId);

//     if (!lab) {
//         throw new Error("Lab not found");
//     }

//     // First 3 letters of lab name
//     const prefix = lab.labName
//         .replace(/[^a-zA-Z]/g, "")
//         .substring(0, 3)
//         .toUpperCase();

//     // Current IST date
//     const date = new Intl.DateTimeFormat("en-CA", {
//         timeZone: "Asia/Kolkata",
//         year: "numeric",
//         month: "2-digit",
//         day: "2-digit"
//     })
//         .format(new Date())
//         .replace(/-/g, "");

//     // Find today's patients for this lab
//     const patients = await Patient.find({
//         labId,
//         caseId: new RegExp(`^${prefix}${date}\\d+$`)
//     }).sort({ caseId: -1 });

//     let sequence = 1;

//     if (patients.length > 0) {
//         const latestCaseId = patients[0].caseId;

//         // Remove prefix + date
//         const lastNumber = latestCaseId.replace(`${prefix}${date}`, "");

//         sequence = Number(lastNumber) + 1;
//     }

//     return `${prefix}${date}${String(sequence).padStart(3, "0")}`;
// };

const generateLabPrefix = async (labName, labId) => {
    const cleanedName = labName
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase();

    // First 2 letters from lab name
    const firstTwo = cleanedName.substring(0, 2);

    // Try original first 3 letters
    const originalPrefix = cleanedName.substring(0, 3);

    // Check if this prefix is already used by another lab
    const existingPatient = await Patient.findOne({
        labId: { $ne: labId },
        caseId: new RegExp(`^${originalPrefix}\\d{8}\\d+$`)
    });

    // If original prefix is free, use it
    if (!existingPatient) {
        return originalPrefix;
    }

    // Otherwise keep first 2 letters
    // and change only the 3rd letter
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const letter of letters) {
        const newPrefix = `${firstTwo}${letter}`;

        const exists = await Patient.findOne({
            labId: { $ne: labId },
            caseId: new RegExp(`^${newPrefix}\\d{8}\\d+$`)
        });

        if (!exists) {
            return newPrefix;
        }
    }

    throw new Error("No unique 3-letter prefix available");
};

const generateCaseId = async (labId) => {
    const lab = await Lab.findById(labId);

    if (!lab) {
        throw new Error("Lab not found");
    }

    const prefix = await generateLabPrefix(
        lab.labName,
        labId
    );

    const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    })
        .format(new Date())
        .replace(/-/g, "");

    const patients = await Patient.find({
        labId,
        caseId: new RegExp(`^${prefix}${date}\\d+$`)
    }).sort({ caseId: -1 });

    let sequence = 1;

    if (patients.length > 0) {
        const latestCaseId = patients[0].caseId;

        const lastNumber = latestCaseId.replace(
            `${prefix}${date}`,
            ""
        );

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

// const getPatientsWithPendingReportsDb = async (labId) => {
//     try {

//         // Find reports that have at least one test with isReportSubmitted = false
//         const reportsWithPendingTests = await Report.find({
//             'testReport.isReportSubmitted': false,
//             labId
//         }).select('patientId testReport');

//         // Extract unique patient IDs and create a map of patientId to reportIds/pendingTests
//         const patientIds = [...new Set(reportsWithPendingTests.map(report => report.patientId))];
//         const patientReportMap = {};

//         reportsWithPendingTests.forEach(report => {
//             if (!patientReportMap[report.patientId]) {
//                 patientReportMap[report.patientId] = { reportIds: [], pendingTests: [] };
//             }
//             patientReportMap[report.patientId].reportIds.push(report.id);

//             report.testReport
//                 .filter(test => test.isReportSubmitted === false)
//                 .forEach(test => {
//                     patientReportMap[report.patientId].pendingTests.push({
//                         reportId: report.id,
//                         testReportId: test.testReportId,
//                         testName: test.testName
//                     });
//                 });
//         });

//         // Find patients with those IDs
//         const patients = await Patient.find({
//             '_id': { $in: patientIds },
//             labId
//         });

//         // Add reportIds and pending test names to each patient
//         const patientsWithReportIds = patients.map(patient => ({
//             ...patient.toObject(),
//             reportIds: patientReportMap[patient._id]?.reportIds || [],
//             pendingTests: patientReportMap[patient._id]?.pendingTests || []
//         }));

//         return patientsWithReportIds;
//     } catch (error) {
//         console.error('Error in getPatientsWithPendingReportsDb:', error);
//         return [];
//     }
// }

// const getPatientsWithSubmittedReportsDb = async (labId) => {
//     try {

//         const reportsWithSubmittedTests = await Report.find({
//             'testReport.isReportSubmitted': true,
//             labId
//         }).select('patientId testReport');

//         // Extract unique patient IDs and create a map of patientId to reportIds/submittedTests
//         const patientIds = [...new Set(reportsWithSubmittedTests.map(report => report.patientId))];
//         const patientReportMap = {};

//         reportsWithSubmittedTests.forEach(report => {
//             if (!patientReportMap[report.patientId]) {
//                 patientReportMap[report.patientId] = { reportIds: [], submittedTests: [] };
//             }
//             patientReportMap[report.patientId].reportIds.push(report.id);

//             report.testReport
//                 .filter(test => test.isReportSubmitted === true)
//                 .forEach(test => {
//                     patientReportMap[report.patientId].submittedTests.push({
//                         reportId: report.id,
//                         testReportId: test.testReportId,
//                         testName: test.testName,
//                         // Raw params kept only to resolve reference ranges once the
//                         // patient (age/gender) is known below; stripped before returning.
//                         _rawParameters: test.testParameters || []
//                     });
//                 });
//         });

//         // Find patients with those IDs
//         const patients = await Patient.find({
//             '_id': { $in: patientIds },
//             labId
//         });

//         // Add reportIds and submitted test names to each patient
//         const patientsWithReportIds = await Promise.all(patients.map(async patient => {
//             const mapEntry = patientReportMap[patient._id] || { reportIds: [], submittedTests: [] };

//             const submittedTests = await Promise.all(mapEntry.submittedTests.map(async ({ _rawParameters, ...rest }) => ({
//                 ...rest,
//                 // Reference range per parameter, resolved for this patient's age/gender
//                 testParameters: await resolveParameterRanges(_rawParameters, patient)
//             })));

//             return {
//                 ...patient.toObject(),
//                 reportIds: mapEntry.reportIds,
//                 submittedTests
//             };
//         }));

//         return patientsWithReportIds;
//     } catch (error) {
//         console.error('Error in getPatientsWithSubmittedReportsDb:', error);
//         return [];
//     }
// }

const getPatientsWithPendingReportsDb = async (labId, search = '') => {
    try {

        const reportQuery = {
            labId,
            'testReport.isReportSubmitted': false
        };


        // Add search filter only when search value exists
        if (search && search.trim()) {

            reportQuery.testReport = {
                $elemMatch: {
                    isReportSubmitted: false,
                    $or: [
                        {
                            testName: {
                                $regex: search.trim(),
                                $options: 'i'
                            }
                        },
                        {
                            testCode: {
                                $regex: search.trim(),
                                $options: 'i'
                            }
                        }
                    ]
                }
            };
        }


        // Find reports
        const reportsWithPendingTests = await Report.find(reportQuery)
            .select('patientId testReport');


        const patientIds = [
            ...new Set(
                reportsWithPendingTests.map(
                    report => report.patientId.toString()
                )
            )
        ];


        const patientReportMap = {};

        reportsWithPendingTests.forEach(report => {

            const patientId = report.patientId.toString();

            if (!patientReportMap[patientId]) {
                patientReportMap[patientId] = {
                    reportIds: [],
                    pendingTests: []
                };
            }

            const matchingTests = report.testReport.filter(test => {

                if (test.isReportSubmitted !== false) {
                    return false;
                }

                // No search → all pending tests
                if (!search || !search.trim()) {
                    return true;
                }

                const searchValue = search.trim().toLowerCase();

                return (
                    test.testName
                        ?.toLowerCase()
                        .includes(searchValue) ||

                    test.testCode
                        ?.toLowerCase()
                        .includes(searchValue)
                );
            });


            // Add reportId if this report contains matching pending tests
            if (matchingTests.length > 0) {

                const reportId = report._id.toString();

                if (!patientReportMap[patientId].reportIds.includes(reportId)) {
                    patientReportMap[patientId].reportIds.push(reportId);
                }

            }


            matchingTests.forEach(test => {

                patientReportMap[patientId]
                    .pendingTests
                    .push({
                        reportId: report._id.toString(),
                        testReportId: test.testReportId,
                        testName: test.testName,
                        testCode: test.testCode
                    });

            });

        });

        // reportsWithPendingTests.forEach(report => {

        //     const patientId = report.patientId.toString();


        //     if (!patientReportMap[patientId]) {
        //         patientReportMap[patientId] = {
        //             reportIds: [],
        //             pendingTests: []
        //         };
        //     }


        //     report.testReport
        //         .filter(test => {

        //             if (test.isReportSubmitted !== false) {
        //                 return false;
        //             }


        //             // If no search, return all pending tests
        //             if (!search || !search.trim()) {
        //                 return true;
        //             }


        //             const searchValue =
        //                 search.trim().toLowerCase();


        //             return (
        //                 test.testName
        //                     ?.toLowerCase()
        //                     .includes(searchValue) ||

        //                 test.testCode
        //                     ?.toLowerCase()
        //                     .includes(searchValue)
        //             );

        //         })
        //         .forEach(test => {

        //             patientReportMap[patientId]
        //                 .pendingTests
        //                 .push({
        //                     reportId: report.id,
        //                     testReportId: test.testReportId,
        //                     testName: test.testName,
        //                     testCode: test.testCode
        //                 });

        //         });

        // });


        // Important: only patients with matching tests
        const filteredPatientIds =
            Object.keys(patientReportMap)
                .filter(
                    patientId =>
                        patientReportMap[patientId]
                            .pendingTests
                            .length > 0
                );


        const patients = await Patient.find({
            _id: {
                $in: filteredPatientIds
            },
            labId
        });


        const patientsWithReportIds = patients.map(patient => {

            const patientId =
                patient._id.toString();
            return {
                ...patient.toObject(),

                reportIds:
                    patientReportMap[patientId]
                        ?.reportIds || [],

                pendingTests:
                    patientReportMap[patientId]
                        ?.pendingTests || []
            };

        });


        return patientsWithReportIds;

    } catch (error) {

        console.error(
            'Error in getPatientsWithPendingReportsDb:',
            error
        );

        throw error;
    }
};

const getPatientsWithSubmittedReportsDb = async (
    labId,
    {
        filter = 'all',
        startDate,
        endDate
    } = {}
) => {
    try {

        let dateFilter = {};

        const now = new Date();

        switch (filter) {

            case 'lastWeek': {
                const lastWeek = new Date();

                lastWeek.setDate(now.getDate() - 7);

                dateFilter = {
                    createdAt: {
                        $gte: lastWeek,
                        $lte: now
                    }
                };

                break;
            }


            case 'lastMonth': {
                const lastMonth = new Date();

                lastMonth.setMonth(now.getMonth() - 1);

                dateFilter = {
                    createdAt: {
                        $gte: lastMonth,
                        $lte: now
                    }
                };

                break;
            }


            case 'lastYear': {
                const lastYear = new Date();

                lastYear.setFullYear(now.getFullYear() - 1);

                dateFilter = {
                    createdAt: {
                        $gte: lastYear,
                        $lte: now
                    }
                };

                break;
            }


            case 'custom': {

                if (!startDate || !endDate) {
                    throw new Error(
                        'startDate and endDate are required for custom filter'
                    );
                }

                const customStartDate = new Date(startDate);
                const customEndDate = new Date(endDate);

                // Include the complete end date
                customEndDate.setHours(23, 59, 59, 999);

                dateFilter = {
                    createdAt: {
                        $gte: customStartDate,
                        $lte: customEndDate
                    }
                };

                break;
            }


            case 'all':
            default:
                dateFilter = {};
        }


        const reportsWithSubmittedTests = await Report.find({
            'testReport.isReportSubmitted': true,
            labId,
            ...dateFilter
        }).select('patientId testReport');


        // Extract unique patient IDs
        const patientIds = [
            ...new Set(
                reportsWithSubmittedTests.map(
                    report => report.patientId.toString()
                )
            )
        ];


        const patientReportMap = {};


        reportsWithSubmittedTests.forEach(report => {

            const patientId = report.patientId.toString();

            if (!patientReportMap[patientId]) {
                patientReportMap[patientId] = {
                    reportIds: [],
                    submittedTests: []
                };
            }


            patientReportMap[patientId].reportIds.push(report._id);


            report.testReport
                .filter(test => test.isReportSubmitted === true)
                .forEach(test => {

                    patientReportMap[patientId].submittedTests.push({
                        reportId: report._id,
                        testReportId: test.testReportId,
                        testName: test.testName,
                        _rawParameters: test.testParameters || []
                    });

                });

        });


        // Find patients
        const patients = await Patient.find({
            _id: { $in: patientIds },
            labId
        });


        const patientsWithReportIds = await Promise.all(
            patients.map(async patient => {

                const patientId = patient._id.toString();

                const mapEntry =
                    patientReportMap[patientId] || {
                        reportIds: [],
                        submittedTests: []
                    };


                const submittedTests = await Promise.all(

                    mapEntry.submittedTests.map(
                        async ({ _rawParameters, ...rest }) => ({
                            ...rest,

                            testParameters:
                                await resolveParameterRanges(
                                    _rawParameters,
                                    patient
                                )
                        })
                    )

                );


                return {
                    ...patient.toObject(),
                    reportIds: mapEntry.reportIds,
                    submittedTests
                };

            })
        );


        return patientsWithReportIds;

    } catch (error) {

        console.error(
            'Error in getPatientsWithSubmittedReportsDb:',
            error
        );

        throw error;
    }
};

module.exports = {
    addPatientDb,
    getAllPatientDb,
    getPatientsWithPendingReportsDb,
    getPatientsWithSubmittedReportsDb
};
