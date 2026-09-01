const { sendResponse } = require("../../utils/sendResponse");
const mongoose = require('mongoose');
const { addPatientReportDb, getAllPatientReportDB, getReportByIdDB, getTestsListForReportDb, createNewReportDb, saveReportPdfMetadataDb } = require("../../db/report/report");
const { validateParameterRanges, updateParameterStatus } = require("../../utils/parameterRangeValidator");
const { resolveParameterRanges } = require("../../utils/parameterRangeResolver");
const Report = require("../../models/reports");
const PatientModal = require("../../models/patient");
const ParameterSubCategory = require("../../models/parameterSubCategoryModel");
const path = require("path");

const createNewReport = async (req, res) => {
    try {
        const { patientId, testReports } = req.body;
        const labId = req.labId;

        // Support both string array and object array for testReports
        if (testReports && Array.isArray(testReports)) {
            for (const testReport of testReports) {
                if (typeof testReport === 'object' && testReport.testReportId) {
                    // Validate testReportId format if provided
                    if (!mongoose.Types.ObjectId.isValid(testReport.testReportId)) {
                        return sendResponse(req, res, 400, {
                            success: false,
                            message: 'Invalid testReportId format'
                        });
                    }
                }
            }
        }

        const result = await createNewReportDb(patientId, testReports, labId);

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

const addPatientReportOld = async (req, res) => {
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

        // Build the report object for PDF with real patient data
        const reportForPDF = {
            labId,
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

        // Generate PDF with populated data
        const pdf = await generatePatientReportPDF(reportForPDF);

        // Generate PDF buffer in memory
        // const pdf = await generatePatientReportPDF(savedReport);

        // Validate buffer is a real PDF before uploading
        if (!pdf.buffer || pdf.buffer.length === 0) {
            throw new Error("PDF buffer is empty");
        }

        // PDF magic bytes check — every valid PDF starts with %PDF
        const pdfHeader = pdf.buffer.slice(0, 4).toString("ascii");
        if (pdfHeader !== "%PDF") {
            throw new Error(`Invalid PDF buffer. Header found: ${pdfHeader}`);
        }

        const publicId = `reports/${path.parse(pdf.fileName).name}`;

        // Save PDF to local file system
        let localPDFInfo = null;
        try {
            localPDFInfo = await savePatientReportPDFLocally(pdf.buffer, pdf.fileName);
            // console.log("PDF saved locally:", localPDFInfo.localPath);
        } catch (err) {
            console.error("Local PDF save failed (non-fatal):", err.message);
        }

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

        const pdfMetadataResult = await saveReportPdfMetadataDb(savedReport._id, labId, {
            pdfUrl
        });

        if (!pdfMetadataResult?.success) {
            console.error("Failed to save PDF metadata to report:", pdfMetadataResult?.error || pdfMetadataResult?.message);
        }

        // Send WhatsApp — wrapped so a failure doesn't roll back the saved report
        let whatsappError = null;
        try {

            await sendWhatsAppMessages(
                "labReport",
                [patient.mobileNumber],
                {
                    patientName: patient.name || patient.patientName || "",
                    doctorContactNo: patient.doctorContactNo || "",
                    doctorName : patient.referredByDoctor || "",
                    labName: req.owner?.labName || req.labName || "Queueless",
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

const addPatientReport = async (req, res) => {
    try {
        const { reportId, tests } = req.body; 
        const labId = req.labId;

        if (!tests || !Array.isArray(tests) || tests.length === 0) {
            return sendResponse(req, res, 400, {
                success: false,
                message: "tests array is required and cannot be empty"
            });
        }

        for (const test of tests) {
            if (typeof test !== 'object' || !test.testId) {
                return sendResponse(req, res, 400, {
                    success: false,
                    message: "Each test entry must include a valid testId"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(test.testId)) {
                return sendResponse(req, res, 400, {
                    success: false,
                    message: "Invalid testId format"
                });
            }
        }

        // Pass the array payload directly to the DB service layer
        const result = await addPatientReportDb({
            reportId,
            labId,
            tests 
        });

        if (!result || result.success === false || (result.statusCode && result.statusCode >= 400)) {
            return sendResponse(req, res, result?.statusCode || 400, {
                success: false,
                message: result?.message || result?.error || "Unable to add patient reports"
            });
        }

        const { generatePatientReportPDF, savePatientReportPDFLocally } = require("../../services/pdfService");
        const { sendWhatsAppMessages } = require("../../services/whatsappService");
        const { Readable } = require("stream");

        const savedReport = result.data;

        // Retrieve the single patient document linked to this main report
        const patient = await PatientModal.findById(savedReport.patientId);
        if (!patient) {
            throw new Error("Patient not found");
        }

        // Resolve the reference range for every parameter against this patient's
        // age/gender so the generated PDF's REF VALUE column is populated.
        const isFilled = (v) => v !== undefined && v !== null && v !== "";
        // A stored value may be a bare scalar OR an object like
        // { value: 13.5, unit: "g/dL", referenceRange: "13-17" }.
        const pickScalar = (v) => (v && typeof v === "object" && !Array.isArray(v))
            ? (v.value ?? v.result ?? v.resultValue ?? v.reading ?? "")
            : v;
        // "RBC Morphology_1" / "rbc morphology_1" / "RBC_MORPHOLOGY_1" all -> "rbc_morphology_1"
        const normKey = (s) => String(s || "")
            .trim().toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");
        const rangeToText = (rr) => {
            if (!rr) return null;
            if (typeof rr === "string") return rr.trim() || null;
            if (typeof rr === "object") {
                const min = rr.min ?? rr.minValue ?? rr.from;
                const max = rr.max ?? rr.maxValue ?? rr.to;
                return (min !== undefined || max !== undefined) ? `${min ?? ""} - ${max ?? ""}`.trim() : null;
            }
            return String(rr);
        };
        const META_KEYS = new Set([
            "unit", "units", "iscritical", "critical", "referencerange", "refvalue",
            "range", "remarks", "note", "notes", "previousvalues", "collectedat",
            "verifiedby", "status"
        ]);

        const testReportForPDF = await Promise.all((savedReport.testReport || []).map(async test => {
            // Work with plain objects so every stored field is readable.
            const rawParams = (test.testParameters || []).map(p => (p && p.toObject ? p.toObject() : p));

            // testResult is the free-form Map the client posts results into
            // (keyed by an arbitrary label, sub-parameter code/name, or id).
            const legacyResult = test.testResult instanceof Map
                ? Object.fromEntries(test.testResult)
                : (test.testResult && typeof test.testResult === "object" ? test.testResult : {});
            const rawById = new Map();            // exact id/label -> value
            const valueByNormKey = new Map();     // normalised label -> value
            const measurementEntries = [];        // [normKey, value] for non-metadata keys
            for (const [k, v] of Object.entries(legacyResult)) {
                const lk = String(k).trim().toLowerCase();
                rawById.set(lk, v);
                if (META_KEYS.has(lk) || !isFilled(pickScalar(v))) continue;
                valueByNormKey.set(normKey(k), v);
                measurementEntries.push([normKey(k), v]);
            }
            const legacyUnit = legacyResult.unit ?? legacyResult.units ?? "";
            const legacyRangeText = rangeToText(legacyResult.referenceRange ?? legacyResult.refValue ?? legacyResult.range);

            // Pull the sub-parameters for every parameter in this test so a
            // free-form result key can be matched to a specific sub-parameter.
            const paramIds = rawParams.map(p => p.parameterId).filter(Boolean);
            const subCats = paramIds.length
                ? await ParameterSubCategory.find({ parameterId: { $in: paramIds }, delete: false, isActive: true })
                    .select("_id parameterId name code unit").lean()
                : [];
            const subsByParam = new Map();
            for (const sc of subCats) {
                const key = sc.parameterId.toString();
                if (!subsByParam.has(key)) subsByParam.set(key, []);
                subsByParam.get(key).push(sc);
            }

            // Resolve ranges for the parameter rows AND for every parameter+subCategory pair.
            const rangeLookupInput = [
                ...rawParams,
                ...subCats.map(sc => ({ parameterId: sc.parameterId, subCategoryId: sc._id }))
            ];
            const resolvedRanges = await resolveParameterRanges(rangeLookupInput, patient);
            const rangeByParamId = new Map();
            const rangeByPair = new Map();
            for (const r of resolvedRanges) {
                if (r.subCategoryId) rangeByPair.set(`${r.parameterId}:${r.subCategoryId}`, r);
                else rangeByParamId.set(r.parameterId, r);
            }

            const findValueForSub = (sc) => {
                const candidates = [
                    rawById.get(sc._id.toString().toLowerCase()),
                    valueByNormKey.get(normKey(sc.code)),
                    valueByNormKey.get(normKey(sc.name))
                ];
                for (const c of candidates) if (isFilled(pickScalar(c))) return c;
                return undefined;
            };

            const outParams = [];
            rawParams.forEach(p => {
                const pid = p.parameterId ? p.parameterId.toString() : "";
                const resolvedParam = rangeByParamId.get(pid);
                const parameterName = resolvedParam?.parameterName || p.parameterName || p.parameter || `Parameter`;
                const subs = subsByParam.get(pid) || [];

                if (subs.length > 0) {
                    // One indented child row per sub-parameter that has a value.
                    const children = [];
                    subs.forEach(sc => {
                        let raw = findValueForSub(sc);
                        // structured submission: p carried this subCategoryId + value
                        if (!isFilled(pickScalar(raw)) && p.subCategoryId && p.subCategoryId.toString() === sc._id.toString()) {
                            raw = p.value;
                        }
                        if (!isFilled(pickScalar(raw))) return;
                        const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
                        const pairRange = rangeByPair.get(`${pid}:${sc._id.toString()}`);
                        children.push({
                            parameterName: sc.name || "",
                            value: pickScalar(raw),
                            unit: (obj && (obj.unit ?? obj.units)) || sc.unit || legacyUnit || "",
                            isCritical: Boolean(legacyResult.isCritical),
                            referenceRange: pairRange?.referenceRange?.text
                                || rangeToText(obj && (obj.referenceRange ?? obj.refValue ?? obj.range))
                                || legacyRangeText
                                || null
                        });
                    });

                    // Nothing matched by key but there's exactly one sub and one
                    // free-form value -> assign it to that sub.
                    if (children.length === 0 && subs.length === 1 && measurementEntries.length === 1) {
                        const sc = subs[0];
                        const pairRange = rangeByPair.get(`${pid}:${sc._id.toString()}`);
                        children.push({
                            parameterName: sc.name || "",
                            value: pickScalar(measurementEntries[0][1]),
                            unit: sc.unit || legacyUnit || "",
                            isCritical: Boolean(legacyResult.isCritical),
                            referenceRange: pairRange?.referenceRange?.text || legacyRangeText || null
                        });
                    }

                    if (children.length > 0) {
                        outParams.push({ parameterName, subParameters: children });
                        return;
                    }
                }

                // No sub-parameters (or none matched): a single flat row.
                let value = isFilled(pickScalar(p.value)) ? pickScalar(p.value) : "";
                if (!isFilled(value)) {
                    const flat = [
                        rawById.get(pid.toLowerCase()),
                        valueByNormKey.get(normKey(parameterName)),
                        rawById.get("value"),
                        rawById.get("result"),
                        (rawParams.length === 1 && measurementEntries.length === 1) ? measurementEntries[0][1] : undefined
                    ];
                    for (const c of flat) if (isFilled(pickScalar(c))) { value = pickScalar(c); break; }
                }
                outParams.push({
                    parameterName,
                    value: value ?? "",
                    unit: p.unit || resolvedParam?.unit || legacyUnit || "",
                    isCritical: p.isCritical ?? (p.status === "CRITICAL") ?? Boolean(legacyResult.isCritical),
                    referenceRange: resolvedParam?.referenceRange?.text
                        || rangeToText(p.referenceRange || p.referenceRangeText)
                        || legacyRangeText
                        || null,
                    remarks: p.notes || p.remarks || ""
                });
            });

            return {
                testName: test.testName || "Lab Test",
                testResult: test.testResult || null,
                testParameters: outParams
            };
        }));

        // Construct structural map for multi-test report generation
        const reportForPDF = {
            labId,
            patientName: patient.name || patient.patientName || "",
            mobileNumber: patient.mobileNumber || "",
            gender: patient.gender || "",
            age: patient.age !== undefined && patient.age !== null ? `${patient.age} ${patient.ageType || ""}`.trim() : "",
            address: patient.address || "",
            regNumber: patient.caseId || savedReport._id?.toString() || "",
            regDateTime: patient.createdAt || savedReport.createdAt || null,
            referredBy: patient.referredByDoctor || "",
            referredByContact: patient.doctorContactNo || "",
            reportId: savedReport._id?.toString() || "",
            reportDate: savedReport.createdAt || new Date(),
            testReport: testReportForPDF
        };

        // Temporary: inspect exactly what feeds the PDF so blank RESULTS/UNITS/
        // REF VALUE columns can be traced back to the submitted payload.
        console.log("=== PDF DEBUG ===");
        console.log("req.body:", JSON.stringify(req.body, null, 2));
        console.log("saved testReport:", JSON.stringify(
            (savedReport.testReport || []).map(t => ({
                testName: t.testName,
                testResult: t.testResult instanceof Map ? Object.fromEntries(t.testResult) : t.testResult,
                testParameters: (t.testParameters || []).map(p => (p.toObject ? p.toObject() : p))
            })), null, 2));
        console.log("reportForPDF:", JSON.stringify(reportForPDF, null, 2));
        console.log("=== /PDF DEBUG ===");

        // Render the raw PDF data pipeline across the newly structured object
        const pdf = await generatePatientReportPDF(reportForPDF);

        if (!pdf.buffer || pdf.buffer.length === 0) {
            throw new Error("PDF buffer is empty");
        }

        const pdfHeader = pdf.buffer.slice(0, 4).toString("ascii");
        if (pdfHeader !== "%PDF") {
            throw new Error(`Invalid PDF buffer. Header found: ${pdfHeader}`);
        }

        const publicId = `reports/${path.parse(pdf.fileName).name}`;

        let localPDFInfo = null;
        try {
            localPDFInfo = await savePatientReportPDFLocally(pdf.buffer, pdf.fileName);
        } catch (err) {
            console.error("Local PDF save failed (non-fatal):", err.message);
        }

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

        const pdfMetadataResult = await saveReportPdfMetadataDb(savedReport._id, labId, {
            pdfUrl
        });

        if (!pdfMetadataResult?.success) {
            console.error("Failed to save PDF metadata to report:", pdfMetadataResult?.error || pdfMetadataResult?.message);
        }

        let whatsappError = null;
        try {
            await sendWhatsAppMessages(
                "labReport",
                [patient.mobileNumber],
                {
                    patientName: patient.name || patient.patientName || "",
                    doctorContactNo: patient.doctorContactNo || "",
                    doctorName: patient.referredByDoctor || "",
                    labName: req.owner?.labName || req.labName || "Queueless",
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
                ...(whatsappError && { whatsappWarning: whatsappError })
            }
        };

        return sendResponse(req, res, 200, responseData);

    } catch (error) {
        console.error(error);
        return sendResponse(req, res, 500, {
            success: false,
            message: error.message
        });
    }
};

// WORKING 
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

//         if (!result || result.success === false || (result.statusCode && result.statusCode >= 400)) {
//             return sendResponse(req, res, result?.statusCode || 400, {
//                 success: false,
//                 message: result?.message || result?.error || "Unable to add patient report"
//             });
//         }

//         const { generatePatientReportPDF, savePatientReportPDFLocally } = require("../../services/pdfService");
//         const { sendWhatsAppPDF, sendWhatsAppMessages } = require("../../services/whatsappService");
//         const { Readable } = require("stream");

//         const savedReport = result.data;

//         // Get patient
//         const patient = await PatientModal.findById(savedReport.patientId);
//         if (!patient) {
//             throw new Error("Patient not found");
//         }
//         // log("savedReport=====",savedReport);

//         // Build the report object for PDF with real patient data
//         // Build the report object for PDF with real patient data
//         const reportForPDF = {
//             patientName:  patient.name || patient.patientName || "",
//             mobileNumber: patient.mobileNumber || "",
//             gender:       patient.gender || "",
//             testResult:   testResult || null,          // ← full testResult object from req.body
//             testReport:   savedReport.testReport || [
//                 {
//                     testName:       savedReport.testName || "Lab Test",
//                     testParameters: (savedReport.testParameters || []).map(p => ({
//                         parameterName:  p.parameterName,
//                         value:          p.value ?? "",
//                         unit:           p.unit || "",
//                         isCritical:     p.isCritical ?? false,
//                         referenceRange: p.referenceRange || null,
//                         remarks:        p.remarks || ""
//                     }))
//                 }
//             ]
//         };
//         // const reportForPDF = {
//         //     patientName: patient.name || patient.patientName || "",
//         //     mobileNumber: patient.mobileNumber || "",
//         //     gender: patient.gender || "",
//         //     testReport: savedReport.testReport || [
//         //         {
//         //             testName: savedReport.testName || "Lab Test",
//         //             testParameters: savedReport.testParameters?.map(p => ({
//         //                 parameterName: p.parameterName,
//         //                 value: p.value ?? "",
//         //                 unit: p.unit || ""
//         //             })) || []
//         //         }
//         //     ]
//         // };

//         // console.log("Report for PDF:", JSON.stringify(reportForPDF, null, 2));

//         // ✅ Generate PDF with populated data
//         const pdf = await generatePatientReportPDF(reportForPDF);

//         // Generate PDF buffer in memory
//         // const pdf = await generatePatientReportPDF(savedReport);

//         // ✅ Validate buffer is a real PDF before uploading
//         if (!pdf.buffer || pdf.buffer.length === 0) {
//             throw new Error("PDF buffer is empty");
//         }

//         // PDF magic bytes check — every valid PDF starts with %PDF
//         const pdfHeader = pdf.buffer.slice(0, 4).toString("ascii");
//         if (pdfHeader !== "%PDF") {
//             throw new Error(`Invalid PDF buffer. Header found: ${pdfHeader}`);
//         }

//         // console.log("PDF buffer size:", pdf.buffer.length, "bytes");

//         const publicId = `reports/${path.parse(pdf.fileName).name}`;

//         // Save PDF to local file system
//         let localPDFInfo = null;
//         try {
//             localPDFInfo = await savePatientReportPDFLocally(pdf.buffer, pdf.fileName);
//             // console.log("PDF saved locally:", localPDFInfo.localPath);
//         } catch (err) {
//             console.error("Local PDF save failed (non-fatal):", err.message);
//         }

//         // const uploadResult = await new Promise((resolve, reject) => {
//         //     const uploadStream = cloudinary.uploader.upload_stream(
//         //         {
//         //             resource_type: "image",
//         //             public_id: publicId,
//         //             overwrite: true,
//         //             unique_filename: false ,
//         //             format: "pdf"
//         //         },
//         //         (error, result) => {
//         //             if (error) return reject(error);
//         //             resolve(result);
//         //         }
//         //     );

//         //     // Use Buffer directly instead of Readable.from()
//         //     const bufferStream = new Readable({
//         //         read() {
//         //             this.push(pdf.buffer);
//         //             this.push(null); // signal end of stream
//         //         }
//         //     });

//         //     bufferStream.pipe(uploadStream);
//         // });

//         const uploadResult = await new Promise((resolve, reject) => {
//             const uploadStream = cloudinary.uploader.upload_stream(
//                 {
//                     resource_type: "image",
//                     public_id: publicId,
//                     overwrite: true,
//                     unique_filename: false,
//                     format: "pdf"
//                 },
//                 (error, result) => {
//                     if (error) return reject(error);
//                     resolve(result);
//                 }
//             );

//             const bufferStream = new Readable({
//                 read() {
//                     this.push(pdf.buffer);
//                     this.push(null);
//                 }
//             });

//             bufferStream.pipe(uploadStream);
//         });

//         const pdfUrl = uploadResult.secure_url;

//         // Generate PDF buffer in memory
//         // const pdf = await generatePatientReportPDF(savedReport);

//         // // Derive a stable public_id from the filename (without extension)
//         // const publicId = `reports/${path.parse(pdf.fileName).name}`;

//         // // Upload PDF buffer directly to Cloudinary
//         // const uploadResult = await new Promise((resolve, reject) => {
//         //     const uploadStream = cloudinary.uploader.upload_stream(
//         //         {
//         //             resource_type: "raw",   // ✅ use "raw" for PDFs — "auto" can misclassify
//         //             public_id: publicId,
//         //             overwrite: true,
//         //             unique_filename: false,
//         //             format: "pdf"
//         //         },
//         //         (error, result) => {
//         //             if (error) return reject(error);
//         //             resolve(result);
//         //         }
//         //     );

//         //     Readable.from(pdf.buffer).pipe(uploadStream);
//         // });

//         // // Build a direct-download URL (fl_attachment forces browser download)
//         // const pdfUrl = cloudinary.url(uploadResult.public_id, {
//         //     resource_type: "raw",
//         //     secure: true,
//         //     flags: "attachment"   // ensures WhatsApp/browser treats it as a file
//         // });

//         // console.log("Cloudinary PDF URL:", pdfUrl);

//         // // Get patient
//         // const patient = await PatientModal.findById(savedReport.patientId);
//         // if (!patient) {
//         //     throw new Error("Patient not found");
//         // }

//         // Send WhatsApp — wrapped so a failure doesn't roll back the saved report
//         let whatsappError = null;
//         try {
//             // console.log("pdfUrl", pdfUrl);

//             await sendWhatsAppMessages(
//                 "labReport",
//                 [patient.mobileNumber],
//                 {
//                     pdfUrl: pdfUrl
//                 }
//             );

//         } catch (err) {
//             console.error("WhatsApp send failed (non-fatal):", err.message);
//             whatsappError = err.message;
//         }

//         const responseData = {
//             success: true,
//             data: {
//                 ...((savedReport?.toObject) ? savedReport.toObject() : savedReport),
//                 pdfUrl,
//                 cloudinary: {
//                     publicId: uploadResult.public_id,
//                     resourceType: uploadResult.resource_type,
//                     format: uploadResult.format
//                 },
//                 ...(localPDFInfo && { 
//                     localPDF: {
//                         fileName: localPDFInfo.fileName,
//                         localPath: localPDFInfo.localPath,
//                         accessible: true
//                     }
//                 }),
//                 ...(whatsappError && { whatsappWarning: whatsappError }) // surface warning without failing
//             }
//         };

//         return sendResponse(req, res, 200, responseData);  // explicit 200 on success

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
        // const { labId } = req.body;
        const labId = req.labId;
        
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
        const reportId = req.params?.reportId || req.query?.reportId || req.body?.reportId;
        const labId = req.labId;

        if (!reportId) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'reportId is required'
            });
        }

        const result = await getReportByIdDB(reportId, labId);

        if (!result) {
            return sendResponse(req, res, 404, {
                success: false,
                message: 'Report not found'
            });
        }

        return sendResponse(req, res, 200, {
            success: true,
            data: result
        });
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
