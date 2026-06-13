const { sendResponse } = require("../../utils/sendResponse");
const mongoose = require('mongoose');
const { addPatientReportDb, getAllPatientReportDB, getReportByIdDB, getTestsListForReportDb, createNewReportDb } = require("../../db/report/report");
const { validateParameterRanges, updateParameterStatus } = require("../../utils/parameterRangeValidator");
const Report = require("../../models/reports");
const PatientModal = require("../../models/patient");
const path = require("path");

const createNewReport = async (req, res) => {
    try {
        const { patientId, tests } = req.body;
        const labId = req.labId;
        
        // Support both string array and object array for tests
        if (tests && Array.isArray(tests)) {
            for (const test of tests) {
                if (typeof test === 'object' && test.testId) {
                    // Validate testId format if provided
                    if (!mongoose.Types.ObjectId.isValid(test.testId)) {
                        return sendResponse(req, res, 400, {
                            success: false,
                            message: 'Invalid testId format'
                        });
                    }
                }
            }
        }
        
        const result = await createNewReportDb(patientId, tests, labId);
        
        return sendResponse(req, res, result.statusCode, result.data);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

// const path = require("path");
const { cloudinary } = require("../../cloudinary/index");
const { log } = require("console");

// const path = require("path"); // ensure this is at the top of your file

const addPatientReport = async (req, res) => {
    try {
        const { reportId, testId, testResult, testParameters } = req.body;
        const labId = req.labId;

        if (!testId) {
            return sendResponse(req, res, 400, {
                success: false,
                message: "testId is required"
            });
        }

        const result = await addPatientReportDb({
            reportId,
            testId,
            testResult,
            labId,
            testParameters
        });

        if (!result || result.success === false || (result.statusCode && result.statusCode >= 400)) {
            return sendResponse(req, res, result?.statusCode || 400, {
                success: false,
                message: result?.message || result?.error || "Unable to add patient report"
            });
        }

        const { generatePatientReportPDF, savePatientReportPDFLocally } = require("../../services/pdfService");
        const { sendWhatsAppPDF, sendWhatsAppMessages } = require("../../services/whatsappService");
        const { Readable } = require("stream");

        const savedReport = result.data;

        // Get patient
        const patient = await PatientModal.findById(savedReport.patientId);
        if (!patient) {
            throw new Error("Patient not found");
        }
        // log("savedReport=====",savedReport);

        // Build the report object for PDF with real patient data
        // Build the report object for PDF with real patient data
        const reportForPDF = {
            patientName:  patient.name || patient.patientName || "",
            mobileNumber: patient.mobileNumber || "",
            gender:       patient.gender || "",
            testResult:   testResult || null,          // ← full testResult object from req.body
            testReport:   savedReport.testReport || [
                {
                    testName:       savedReport.testName || "Lab Test",
                    testParameters: (savedReport.testParameters || []).map(p => ({
                        parameterName:  p.parameterName,
                        value:          p.value ?? "",
                        unit:           p.unit || "",
                        isCritical:     p.isCritical ?? false,
                        referenceRange: p.referenceRange || null,
                        remarks:        p.remarks || ""
                    }))
                }
            ]
        };
        // const reportForPDF = {
        //     patientName: patient.name || patient.patientName || "",
        //     mobileNumber: patient.mobileNumber || "",
        //     gender: patient.gender || "",
        //     testReport: savedReport.testReport || [
        //         {
        //             testName: savedReport.testName || "Lab Test",
        //             testParameters: savedReport.testParameters?.map(p => ({
        //                 parameterName: p.parameterName,
        //                 value: p.value ?? "",
        //                 unit: p.unit || ""
        //             })) || []
        //         }
        //     ]
        // };

        // console.log("Report for PDF:", JSON.stringify(reportForPDF, null, 2));

        // ✅ Generate PDF with populated data
        const pdf = await generatePatientReportPDF(reportForPDF);

        // Generate PDF buffer in memory
        // const pdf = await generatePatientReportPDF(savedReport);

        // ✅ Validate buffer is a real PDF before uploading
        if (!pdf.buffer || pdf.buffer.length === 0) {
            throw new Error("PDF buffer is empty");
        }

        // PDF magic bytes check — every valid PDF starts with %PDF
        const pdfHeader = pdf.buffer.slice(0, 4).toString("ascii");
        if (pdfHeader !== "%PDF") {
            throw new Error(`Invalid PDF buffer. Header found: ${pdfHeader}`);
        }

        // console.log("PDF buffer size:", pdf.buffer.length, "bytes");

        const publicId = `reports/${path.parse(pdf.fileName).name}`;

        // Save PDF to local file system
        let localPDFInfo = null;
        try {
            localPDFInfo = await savePatientReportPDFLocally(pdf.buffer, pdf.fileName);
            // console.log("PDF saved locally:", localPDFInfo.localPath);
        } catch (err) {
            console.error("Local PDF save failed (non-fatal):", err.message);
        }

        // const uploadResult = await new Promise((resolve, reject) => {
        //     const uploadStream = cloudinary.uploader.upload_stream(
        //         {
        //             resource_type: "image",
        //             public_id: publicId,
        //             overwrite: true,
        //             unique_filename: false ,
        //             format: "pdf"
        //         },
        //         (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result);
        //         }
        //     );

        //     // Use Buffer directly instead of Readable.from()
        //     const bufferStream = new Readable({
        //         read() {
        //             this.push(pdf.buffer);
        //             this.push(null); // signal end of stream
        //         }
        //     });

        //     bufferStream.pipe(uploadStream);
        // });

        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    public_id: publicId,
                    overwrite: true,
                    unique_filename: false,
                    format: "pdf"
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );

            const bufferStream = new Readable({
                read() {
                    this.push(pdf.buffer);
                    this.push(null);
                }
            });

            bufferStream.pipe(uploadStream);
        });

        const pdfUrl = uploadResult.secure_url;

//         console.log("Cloudinary PDF resource_type:", uploadResult.resource_type, "==TYPEE==",
// uploadResult.type, "SECURE",
// uploadResult.secure_url);
        // console.log("Upload size:", uploadResult.bytes, "bytes");

        // Generate PDF buffer in memory
        // const pdf = await generatePatientReportPDF(savedReport);

        // // Derive a stable public_id from the filename (without extension)
        // const publicId = `reports/${path.parse(pdf.fileName).name}`;

        // // Upload PDF buffer directly to Cloudinary
        // const uploadResult = await new Promise((resolve, reject) => {
        //     const uploadStream = cloudinary.uploader.upload_stream(
        //         {
        //             resource_type: "raw",   // ✅ use "raw" for PDFs — "auto" can misclassify
        //             public_id: publicId,
        //             overwrite: true,
        //             unique_filename: false,
        //             format: "pdf"
        //         },
        //         (error, result) => {
        //             if (error) return reject(error);
        //             resolve(result);
        //         }
        //     );

        //     Readable.from(pdf.buffer).pipe(uploadStream);
        // });

        // // Build a direct-download URL (fl_attachment forces browser download)
        // const pdfUrl = cloudinary.url(uploadResult.public_id, {
        //     resource_type: "raw",
        //     secure: true,
        //     flags: "attachment"   // ensures WhatsApp/browser treats it as a file
        // });

        // console.log("Cloudinary PDF URL:", pdfUrl);

        // // Get patient
        // const patient = await PatientModal.findById(savedReport.patientId);
        // if (!patient) {
        //     throw new Error("Patient not found");
        // }

        // Send WhatsApp — wrapped so a failure doesn't roll back the saved report
        let whatsappError = null;
        try {
            await sendWhatsAppMessages(
                "labReport",
                [patient.mobileNumber],
                {
                    pdfUrl: pdfUrl
                }
            );

        } catch (err) {
            console.error("WhatsApp send failed (non-fatal):", err.message);
            whatsappError = err.message;
        }

        const responseData = {
            success: true,
            data: {
                ...((savedReport?.toObject) ? savedReport.toObject() : savedReport),
                pdfUrl,
                cloudinary: {
                    publicId: uploadResult.public_id,
                    resourceType: uploadResult.resource_type,
                    format: uploadResult.format
                },
                ...(localPDFInfo && { 
                    localPDF: {
                        fileName: localPDFInfo.fileName,
                        localPath: localPDFInfo.localPath,
                        accessible: true
                    }
                }),
                ...(whatsappError && { whatsappWarning: whatsappError }) // surface warning without failing
            }
        };

        return sendResponse(req, res, 200, responseData);  // explicit 200 on success

    } catch (error) {
        console.error(error);
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
};

// const addPatientReport = async (req, res) => {
//     try {
//         const { reportId, testId, testResult, testParameters } = req.body;
//         const labId = req.labId;

//         if (!testId) {
//             return sendResponse(req, res, 400, {
//                 success: false,
//                 message: "testId is required"
//             });
//         }

//         const result = await addPatientReportDb({
//             reportId,
//             testId,
//             testResult,
//             labId,
//             testParameters
//         });

//         console.log("addPatientReportDb result:", result);

//         if (result.success === false || (result.statusCode && result.statusCode >= 400)) {
//             return sendResponse(req, res, result.statusCode || 400, {
//                 success: false,
//                 message: result.message || result.error || 'Unable to add patient report'
//             });
//         }

//         console.log("=============");
//         const { generatePatientReportPDF } = require("../../services/pdfService");
//         const { sendWhatsAppPDF } = require("../../services/whatsappService");
//         const { Readable } = require("stream");

//         const savedReport = result.data;

//         // Generate PDF buffer in memory
//         const pdf = await generatePatientReportPDF(savedReport);

//         // Upload PDF buffer directly to Cloudinary with a stable public_id and raw resource type
//         const publicId = `reports/${path.parse(pdf.fileName).name}`;
//         const uploadResult = await new Promise((resolve, reject) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//                 {
//                     resource_type: "auto",
//                     public_id: publicId,
//                     overwrite: true,
//                     unique_filename: false,
//                     format: "pdf"
//                 },
//                 (error, result) => {
//                     if (error) {
//                         return reject(error);
//                     }
//                     resolve(result);
//                 }
//             );

//             Readable.from(pdf.buffer).pipe(uploadStream);
//         });

//         console.log("Cloudinary Upload:", uploadResult);

//         const pdfUrl = uploadResult.secure_url;

//         console.log("Cloudinary PDF URL:", pdfUrl);

//         // Get patient
//         const patient = await PatientModal.findById(savedReport.patientId);

//         if (!patient) {
//             throw new Error("Patient not found");
//         }

//         // Send WhatsApp
//         await sendWhatsAppPDF(
//             patient.mobileNumber,
//             pdfUrl,
//             pdf.fileName
//         );

//         const responseData = {
//             ...((savedReport && savedReport.toObject) ? savedReport.toObject() : savedReport),
//             pdfUrl,
//             cloudinary: {
//                 publicId: uploadResult.public_id,
//                 resourceType: uploadResult.resource_type,
//                 format: uploadResult.format
//             }
//         };

//         return sendResponse(req, res, result.statusCode, responseData);

//     } catch (error) {
//         console.error(error);
//         return sendResponse(req, res, 500, {
//             success: false,
//             message: error.message
//         });
//     }
// };

// const addPatientReport = async (req, res) => {
//     try {
//         const { reportId, testId, testResult, testParameters } = req.body;
//         const labId = req.labId;

//         if (!testId) {
//             return sendResponse(req, res, 400, {
//                 success: false,
//                 message: 'testId is required'
//             });
//         }

//         // Allow either traditional testResult or new testParameters
//         if (!testResult && !testParameters) {
//             return sendResponse(req, res, 400, {
//                 success: false,
//                 message: 'Either testResult or testParameters must be provided'
//             });
//         }

//         if (testResult && typeof testResult !== "object") {
//             return sendResponse(req, res, 400, {
//                 success: false,
//                 message: 'testResult must be an object'
//             });
//         }

//         if (testParameters && !Array.isArray(testParameters)) {
//             return sendResponse(req, res, 400, {
//                 success: false,
//                 message: 'testParameters must be an array'
//             });
//         }

//         // Get patient ID from report for range validation
//         const report = await Report.findById(reportId);
//         if (!report) {
//             return sendResponse(req, res, 404, {
//                 success: false,
//                 message: 'Report not found'
//             });
//         }

//         // Validate parameter ranges if testParameters are provided
//         if (testParameters && testParameters.length > 0) {
//             const validation = await validateParameterRanges(testParameters, report.patientId);
            
//             if (!validation.isValid) {
//                 return sendResponse(req, res, 400, {
//                     success: false,
//                     message: 'Parameter values are outside normal ranges',
//                     errors: validation.errors,
//                     warnings: validation.warnings
//                 });
//             }

//             // Update parameter status based on ranges
//             const updatedParameters = await updateParameterStatus(testParameters, report.patientId);
            
//             // Use updated parameters with status
//             const result = await addPatientReportDb({
//                 reportId,
//                 testId,
//                 testResult,
//                 labId,
//                 testParameters: updatedParameters
//             });

//             return sendResponse(req, res, result.statusCode, {
//                 ...result.data,
//                 warnings: validation.warnings
//             });
//         }

//         const result = await addPatientReportDb({
//             reportId,
//             testId,
//             testResult,
//             labId,
//             testParameters
//         });

//         const {
//             generatePatientReportPDF
//         } = require('../../services/pdfService');

//         const {
//             sendWhatsAppPDF
//         } = require('../../services/whatsappService');

//         const savedReport = result.data;

//         // Generate PDF
//         const pdf = await generatePatientReportPDF(savedReport);

//         // Public PDF URL
//         // const pdfUrl =
//         //     `${process.env.BASE_URL}/uploads/reports/${pdf.fileName}`;

//             const pdfUrl = path.join(
//                 __dirname,
//                 "../../uploads/reports",
//                 pdf.fileName
//             );
//             console.log("pdfUrl====before sending WhatsApp====", pdfUrl);

//             const patient = await PatientModal.findById(
//                 savedReport.patientId
//             );

//             if (!patient) {
//                 throw new Error('Patient not found');
//             }

//             const mobileNumber = patient.mobileNumber;

//             // console.log("savedReport", savedReport, pdfUrl);
            
//         // Send to patient WhatsApp
//         await sendWhatsAppPDF(
//             mobileNumber,
//             pdfUrl,
//             pdf.fileName
//         );

//         return sendResponse(req, res, result.statusCode, result.data);

//     } catch (error) {
//         return sendResponse(req, res, 500, {
//             success: false,
//             message: error.message
//         });
//     }
// };

const getPatientReport = async (req, res) => {
    try {
        const { patientId } = req.params;
        const labId = req.labId;
        
        const result = await getAllPatientReportDB(labId);
        return sendResponse(req, res, 200, result.data);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function getAllPatientReport(req, res) {
    try {
        const { labId } = req.body;
        
        if (!labId) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'labId is required'
            });
        }
        
        const result = await getAllPatientReportDB(labId);
        return sendResponse(req, res, 200, result.data);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function getReportById(req, res) {
    try {
        const { reportId } = req.params;
        const labId = req.labId;
        
        const result = await getReportByIdDB(reportId, labId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

async function getTestsListReport(req, res) {
    try {
        const { patientId, status } = req.params;
        const labId = req.labId;
        
        const result = await getTestsListForReportDb(patientId, status, labId);
        return sendResponse(req, res, 200, result);
    } catch (error) {
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createNewReport,
    addPatientReport,
    getPatientReport,
    getAllPatientReport,
    getReportById,
    getTestsListReport
};
