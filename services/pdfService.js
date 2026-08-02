const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require("fs");
const path = require("path");
const LaboratoryOwner = require("../models/laboratoryOwner");

// const generatePatientReportPDF = async (report) => {
//     return new Promise((resolve, reject) => {
//         const fileName = `report-${Date.now()}.pdf`;
//         const doc = new PDFDocument({ margin: 50, size: "A4" });
//         const buffers = [];

//         doc.on("data", (chunk) => buffers.push(chunk));
//         doc.on("end", () => resolve({ fileName, buffer: Buffer.concat(buffers) }));
//         doc.on("error", reject);

//         const NAVY = "#1A2B4A";
//         const TEAL = "#0B7B8C";
//         const TEAL_LT = "#E6F4F6";
//         const GRAY = "#6B7280";
//         const LGRAY = "#F3F4F6";
//         const WHITE = "#FFFFFF";
//         const BLACK = "#111827";
//         const PAGE_W = doc.page.width - 100;
//         const LEFT = 50;

//         const hRule = (y, color = TEAL, thickness = 1) => {
//             doc.save()
//                 .moveTo(LEFT, y)
//                 .lineTo(LEFT + PAGE_W, y)
//                 .lineWidth(thickness)
//                 .strokeColor(color)
//                 .stroke()
//                 .restore();
//         };

//         const fillRect = (x, y, w, h, color) => {
//             doc.save().rect(x, y, w, h).fill(color).restore();
//         };

//         const stringify = (value) => {
//             if (value === null || value === undefined) return "—";
//             if (typeof value === "string") return value;
//             if (typeof value === "number" || typeof value === "boolean") return String(value);
//             if (value instanceof Date) return value.toISOString();
//             try {
//                 return JSON.stringify(value);
//             } catch {
//                 return String(value);
//             }
//         };

//         const normalizeResultObject = (value) => {
//             if (value instanceof Map) {
//                 return Object.fromEntries(value);
//             }
//             return value;
//         };

//         const renderHeaderAndPatientInfo = (pageNumber) => {
//             fillRect(0, 0, doc.page.width, 90, NAVY);
//             doc.fillColor(WHITE).fontSize(22).font("Helvetica-Bold")
//                 .text("Queueless", LEFT, 20, { lineBreak: false });
//             doc.fillColor(TEAL).fontSize(10).font("Helvetica")
//                 .text("Accredited Clinical Laboratory • ISO 15189 Certified", LEFT, 48, { lineBreak: false });
//             doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//                 .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, 24, { width: 80, align: "right" });

//             doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//                 .text(`Report ID: ${report.reportId || "N/A"}`, LEFT + PAGE_W - 220, 44, { width: 210, align: "right" });
//             doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//                 .text(`Report Date: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString("en-IN") : "N/A"}`, LEFT + PAGE_W - 220, 58, { width: 210, align: "right" });

//             fillRect(0, 90, doc.page.width, 80, TEAL_LT);
//             hRule(90, TEAL, 2);
//             hRule(170, TEAL, 0.5);

//             const infoFields = [
//                 // ["Report ID", report.reportId || "N/A"],
//                 ["Report Date", report.reportDate ? new Date(report.reportDate).toLocaleDateString("en-IN") : "N/A"],
//                 ["Tests", `${Array.isArray(report.testReport) ? report.testReport.length : 0}`]
//             ];
//             const colW = PAGE_W / infoFields.length;
//             infoFields.forEach(([label, value], i) => {
//                 const x = LEFT + i * colW;
//                 doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                     .text(label.toUpperCase(), x, 100, { lineBreak: false });
//                 doc.fillColor(BLACK).fontSize(12).font("Helvetica-Bold")
//                     .text(value, x, 114, { lineBreak: false });
//             });

//             const patientInfoFields = [
//                 ["Patient", report.patientName || "N/A"],
//                 ["Mobile", report.mobileNumber || "N/A"],
//                 ["Gender", report.gender || "N/A"],
//                 ["Age", report.age || "N/A"]
//             ];
//             const patientColW = PAGE_W / patientInfoFields.length;
//             patientInfoFields.forEach(([label, value], i) => {
//                 const x = LEFT + i * patientColW;
//                 doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                     .text(label.toUpperCase(), x, 140, { lineBreak: false });
//                 doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
//                     .text(value, x, 152, { lineBreak: false });
//             });
//         };

//         const metadataFields = [
//             'unit',
//             'isCritical',
//             'referenceRange',
//             'remarks',
//             'previousValues',
//             'collectedAt',
//             'verifiedBy'
//         ];

//         const buildParameterRows = (test) => {
//             if (Array.isArray(test.testParameters) && test.testParameters.length > 0) {
//                 return test.testParameters.map((param) => ({
//                     parameterName: stringify(param.parameterName || param.name || param.parameter || ""),
//                     value: stringify(param.value),
//                     unit: stringify(param.unit || ""),
//                     referenceRange: stringify(param.referenceRange || ""),
//                     status: stringify(param.status || "PENDING")
//                 }));
//             }

//             if (test.testResult && typeof test.testResult === "object") {
//                 const resultObj = normalizeResultObject(test.testResult);
//                 const measurementKeys = Object.keys(resultObj).filter(key => !metadataFields.includes(key));
//                 const defaultUnit = stringify(resultObj.unit || "");
//                 const status = resultObj.isCritical ? "CRITICAL" : "NORMAL";

//                 return measurementKeys.map((key) => ({
//                     parameterName: stringify(key),
//                     value: stringify(resultObj[key]),
//                     unit: defaultUnit,
//                     referenceRange: stringify(resultObj.referenceRange || ""),
//                     status
//                 }));
//             }

//             return [];
//         };

//         const buildResultMetadata = (test) => {
//             if (!test.testResult || typeof test.testResult !== "object") {
//                 return [];
//             }

//             const resultObj = normalizeResultObject(test.testResult);
//             return [
//                 ['Unit', stringify(resultObj.unit || "")],
//                 ['Critical', stringify(resultObj.isCritical !== undefined ? resultObj.isCritical : "")],
//                 ['Reference Range', resultObj.referenceRange ? `${stringify(resultObj.referenceRange.min)} - ${stringify(resultObj.referenceRange.max)}` : ""],
//                 ['Remarks', stringify(resultObj.remarks || "")],
//                 ['Previous Values', Array.isArray(resultObj.previousValues) ? resultObj.previousValues.map(stringify).join(', ') : stringify(resultObj.previousValues || "")],
//                 ['Collected At', resultObj.collectedAt ? moment(resultObj.collectedAt).format('DD-MM-YYYY') : ""],
//                 ['Verified By', stringify(resultObj.verifiedBy || "")],
//             ].filter(([, value]) => value !== "" && value !== "—");
//         };

//         const renderTestSection = (test, index, totalTests) => {
//             let cursor = 175;
//             fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
//             doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
//                 .text(`TEST ${index + 1}/${totalTests} - ${(test.testName || "Lab Test").toUpperCase()}`, LEFT + 10, cursor + 7, { lineBreak: false });
//             cursor += 40;

//             const rows = buildParameterRows(test);
//             if (rows.length === 0) {
//                 doc.fillColor(GRAY).fontSize(11).font("Helvetica")
//                     .text("No parameter data recorded.", LEFT, cursor);
//                 return;
//             }

//             fillRect(LEFT, cursor, PAGE_W, 18, LGRAY);
//             doc.fillColor(BLACK).fontSize(8).font("Helvetica-Bold");
//             doc.text("PARAMETER", LEFT + 8, cursor + 4, { lineBreak: false });
//             doc.text("VALUE", LEFT + 180, cursor + 4, { lineBreak: false });
//             doc.text("UNIT", LEFT + 260, cursor + 4, { lineBreak: false });
//             doc.text("RANGE", LEFT + 345, cursor + 4, { lineBreak: false });
//             doc.text("STATUS", LEFT + 460, cursor + 4, { lineBreak: false });
//             cursor += 20;

//             rows.forEach((row) => {
//                 const rowHeight = 20;
//                 if (cursor + rowHeight > doc.page.height - 70) {
//                     doc.addPage();
//                     renderHeaderAndPatientInfo(index + 1);
//                     cursor = 175;
//                 }

//                 doc.fillColor(BLACK).fontSize(10).font("Helvetica")
//                     .text(row.parameterName, LEFT + 8, cursor, { lineBreak: false, width: 160 });
//                 doc.fillColor(GRAY).fontSize(10).font("Helvetica")
//                     .text(row.value, LEFT + 180, cursor, { lineBreak: false, width: 70 });
//                 doc.fillColor(GRAY).fontSize(10).font("Helvetica")
//                     .text(row.unit, LEFT + 260, cursor, { lineBreak: false, width: 70 });
//                 doc.fillColor(GRAY).fontSize(10).font("Helvetica")
//                     .text(row.referenceRange, LEFT + 345, cursor, { lineBreak: false, width: 100 });
//                 doc.fillColor(TEAL).fontSize(9).font("Helvetica-Bold")
//                     .text(row.status, LEFT + 460, cursor, { lineBreak: false, width: 90 });
//                 cursor += rowHeight;
//             });

//             const metadataRows = buildResultMetadata(test);
//             if (metadataRows.length > 0) {
//                 cursor += 10;
//                 if (cursor > doc.page.height - 100) {
//                     doc.addPage();
//                     renderHeaderAndPatientInfo(index + 1);
//                     cursor = 175;
//                 }

//                 fillRect(LEFT, cursor, PAGE_W, 24, NAVY);
//                 doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
//                     .text("RESULT METADATA", LEFT + 10, cursor + 7, { lineBreak: false });
//                 cursor += 32;

//                 metadataRows.forEach(([label, value]) => {
//                     if (cursor > doc.page.height - 70) {
//                         doc.addPage();
//                         renderHeaderAndPatientInfo(index + 1);
//                         cursor = 175;
//                     }
//                     doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                         .text(label, LEFT + 8, cursor, { lineBreak: false });
//                     doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
//                         .text(value, LEFT + 120, cursor, { lineBreak: false, width: PAGE_W - 120 });
//                     cursor += 18;
//                 });
//             }
//         };

//         const tests = Array.isArray(report.testReport) ? report.testReport : [];

//         if (tests.length === 0) {
//             renderHeaderAndPatientInfo(1);
//             doc.fillColor(GRAY).fontSize(12).font("Helvetica")
//                 .text("No test data available.", LEFT, 220);
//         } else {
//             tests.forEach((test, index) => {
//                 if (index > 0) {
//                     doc.addPage();
//                 }
//                 renderHeaderAndPatientInfo(index + 1);
//                 renderTestSection(test, index, tests.length);
//             });
//         }

//         doc.end();
//     });
// };

// const generatePatientReportPDF = async (report) => {
//     return new Promise((resolve, reject) => {
//         const fileName = `report-${Date.now()}.pdf`;
//         const doc = new PDFDocument({ margin: 50 });
//         const buffers = [];

//         doc.on('data', chunk => buffers.push(chunk));
//         doc.on('end', () => {
//             resolve({
//                 fileName,
//                 buffer: Buffer.concat(buffers)
//             });
//         });
//         doc.on('error', reject);

//         // Title
//         doc
//             .fontSize(22)
//             .text('Patient Lab Report', {
//                 align: 'center'
//             });

//         doc.moveDown();

//         // Patient Info
//         doc.fontSize(14);

//         doc.text(`Patient Name: ${report.patientName || ''}`);
//         doc.text(`Mobile Number: ${report.mobileNumber || ''}`);
//         doc.text(`Gender: ${report.gender || ''}`);

//         doc.moveDown();

//         // Tests
//         report.testReport.forEach((test, index) => {
//             doc
//                 .fontSize(16)
//                 .text(`Test ${index + 1}: ${test.testName}`);

//             doc.moveDown(0.5);

//             if (test.testParameters?.length > 0) {
//                 test.testParameters.forEach((param) => {
//                     doc
//                         .fontSize(12)
//                         .text(
//                             `${param.parameterName}: ${param.value} ${param.unit || ''}`
//                         );
//                 });
//             }

//             doc.moveDown();
//         });

//         doc.end();
//     });
// };

// const generatePatientReportPDF = async (report) => {
//     return new Promise((resolve, reject) => {
//         const fileName = `report-${Date.now()}.pdf`;
//         const doc = new PDFDocument({ margin: 50, size: "A4" });
//         const buffers = [];

//         doc.on("data", (chunk) => buffers.push(chunk));
//         doc.on("end", () => resolve({ fileName, buffer: Buffer.concat(buffers) }));
//         doc.on("error", reject);

//         // ─── Color palette ───────────────────────────────────────────────
//         const NAVY    = "#1A2B4A";
//         const TEAL    = "#0B7B8C";
//         const TEAL_LT = "#E6F4F6";
//         const DANGER  = "#C0392B";
//         const WARN    = "#E67E22";
//         const OK      = "#1E8449";
//         const GRAY    = "#6B7280";
//         const LGRAY   = "#F3F4F6";
//         const WHITE   = "#FFFFFF";
//         const BLACK   = "#111827";

//         const PAGE_W  = doc.page.width  - 100; // usable width (50px margin each side)
//         const LEFT    = 50;

//         // ─── Helper: horizontal rule ─────────────────────────────────────
//         const hRule = (y, color = TEAL, thickness = 1) => {
//             doc.save()
//                .moveTo(LEFT, y).lineTo(LEFT + PAGE_W, y)
//                .lineWidth(thickness).strokeColor(color).stroke()
//                .restore();
//         };

//         // ─── Helper: filled rect ─────────────────────────────────────────
//         const fillRect = (x, y, w, h, color) => {
//             doc.save().rect(x, y, w, h).fill(color).restore();
//         };

//         // ─── Helper: status badge ─────────────────────────────────────────
//         const badge = (x, y, label, color) => {
//             const PAD = 5;
//             doc.fontSize(8).font("Helvetica-Bold");
//             const tw = doc.widthOfString(label);
//             doc.save()
//                .roundedRect(x, y - 1, tw + PAD * 2, 14, 3)
//                .fill(color);
//             doc.fillColor(WHITE).text(label, x + PAD, y + 1, { lineBreak: false });
//             doc.restore();
//         };

//         // ════════════════════════════════════════════════════════════════
//         // HEADER BAND
//         // ════════════════════════════════════════════════════════════════
//         fillRect(0, 0, doc.page.width, 90, NAVY);

//         // Logo placeholder / Lab name
//         doc.fillColor(WHITE)
//            .fontSize(22).font("Helvetica-Bold")
//            .text("Queueless", LEFT, 20, { lineBreak: false });

//         doc.fillColor(TEAL).fontSize(10).font("Helvetica")
//            .text("Accredited Clinical Laboratory  •  ISO 15189 Certified", LEFT, 48, { lineBreak: false });

//         // Report ID top-right
//         const reportDate = report.testResult?.collectedAt
//             ? new Date(report.testResult.collectedAt).toLocaleDateString("en-IN", {
//                   day: "2-digit", month: "short", year: "numeric"
//               })
//             : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

//         doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//            .text(`Report Date: ${reportDate}`, LEFT + PAGE_W - 120, 25, { lineBreak: false, width: 130, align: "right" })
//            .text(`Generated: ${new Date().toLocaleString("en-IN")}`, LEFT + PAGE_W - 120, 40, { lineBreak: false, width: 130, align: "right" });

//         // ════════════════════════════════════════════════════════════════
//         // PATIENT INFO STRIP
//         // ════════════════════════════════════════════════════════════════
//         fillRect(0, 90, doc.page.width, 55, TEAL_LT);
//         hRule(90, TEAL, 2);
//         hRule(145, TEAL, 0.5);

//         const infoFields = [
//             ["Patient Name",   report.patientName   || "N/A"],
//             ["Mobile",         report.mobileNumber  || "N/A"],
//             ["Gender",         report.gender        || "N/A"],
//         ];

//         const colW = PAGE_W / infoFields.length;
//         infoFields.forEach(([label, value], i) => {
//             const x = LEFT + i * colW;
//             doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                .text(label.toUpperCase(), x, 100, { lineBreak: false });
//             doc.fillColor(BLACK).fontSize(12).font("Helvetica-Bold")
//                .text(value, x, 114, { lineBreak: false });
//         });

//         // ════════════════════════════════════════════════════════════════
//         // SECTION: TEST RESULTS
//         // ════════════════════════════════════════════════════════════════
//         let cursor = 165;

//         // Section heading
//         fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
//         doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
//            .text("TEST RESULTS", LEFT + 10, cursor + 7, { lineBreak: false });
//         cursor += 24;

//         const tests = Array.isArray(report.testReport) ? report.testReport : [];

//         if (tests.length === 0) {
//             doc.fillColor(GRAY).fontSize(12).font("Helvetica")
//                .text("No test data available.", LEFT, cursor + 10);
//         }

//         tests.forEach((test) => {
//             // Test name sub-header
//             cursor += 12;
//             doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold")
//                .text(test.testName || "Lab Test", LEFT, cursor);
//             cursor += 18;
//             hRule(cursor, NAVY, 0.5);
//             cursor += 8;

//             // Table header row
//             const COL = { param: LEFT, value: LEFT + 200, unit: LEFT + 290, range: LEFT + 370, status: LEFT + 470 };
//             fillRect(LEFT, cursor, PAGE_W, 18, LGRAY);
//             doc.fillColor(GRAY).fontSize(8).font("Helvetica-Bold");
//             doc.text("PARAMETER",   COL.param,  cursor + 5, { lineBreak: false });
//             doc.text("RESULT",      COL.value,  cursor + 5, { lineBreak: false });
//             doc.text("UNIT",        COL.unit,   cursor + 5, { lineBreak: false });
//             doc.text("REF. RANGE",  COL.range,  cursor + 5, { lineBreak: false });
//             doc.text("STATUS",      COL.status, cursor + 5, { lineBreak: false });
//             cursor += 18;
//             hRule(cursor, LGRAY);

//             const params = Array.isArray(test.testParameters) ? test.testParameters : [];

//             if (params.length === 0) {
//                 cursor += 8;
//                 doc.fillColor(GRAY).fontSize(10).font("Helvetica")
//                    .text("No parameters recorded.", LEFT, cursor);
//                 cursor += 20;
//             } else {
//                 params.forEach((param, idx) => {
//                     const rowH = 22;
//                     if (idx % 2 === 0) fillRect(LEFT, cursor, PAGE_W, rowH, "#FAFAFA");

//                     const val    = param.value ?? "";
//                     const minRef = param.referenceRange?.min;
//                     const maxRef = param.referenceRange?.max;

//                     // Determine status
//                     let statusLabel = "—";
//                     let statusColor = GRAY;
//                     if (param.isCritical) {
//                         statusLabel = "CRITICAL";
//                         statusColor = DANGER;
//                     } else if (typeof val === "number" && minRef !== undefined && maxRef !== undefined) {
//                         if (val < minRef)       { statusLabel = "LOW";    statusColor = WARN;  }
//                         else if (val > maxRef)  { statusLabel = "HIGH";   statusColor = DANGER; }
//                         else                    { statusLabel = "NORMAL"; statusColor = OK;    }
//                     } else if (param.remarks) {
//                         statusLabel = param.remarks.toUpperCase().slice(0, 8);
//                         statusColor = OK;
//                     }

//                     // Highlight value red if critical or out-of-range
//                     const valColor = (statusLabel === "LOW" || statusLabel === "HIGH" || statusLabel === "CRITICAL")
//                         ? DANGER : BLACK;

//                     doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
//                        .text(param.parameterName || "—", COL.param, cursor + 6, { lineBreak: false, width: 195 });

//                     doc.fillColor(valColor).fontSize(10).font("Helvetica-Bold")
//                        .text(String(val), COL.value, cursor + 6, { lineBreak: false });

//                     doc.fillColor(GRAY).fontSize(9).font("Helvetica")
//                        .text(param.unit || "—", COL.unit, cursor + 6, { lineBreak: false });

//                     const refStr = (minRef !== undefined && maxRef !== undefined)
//                         ? `${minRef} – ${maxRef}` : "—";
//                     doc.fillColor(GRAY).fontSize(9).font("Helvetica")
//                        .text(refStr, COL.range, cursor + 6, { lineBreak: false });

//                     badge(COL.status, cursor + 6, statusLabel, statusColor);

//                     cursor += rowH;
//                     hRule(cursor, "#E5E7EB", 0.3);
//                 });
//             }

//             cursor += 10;
//         });

//         // ════════════════════════════════════════════════════════════════
//         // SECTION: TEST RESULT METADATA (from testResult object)
//         // ════════════════════════════════════════════════════════════════
//         const tr = report.testResult;
//         if (tr) {
//             cursor += 10;

//             // Check page space — add page if needed
//             if (cursor > doc.page.height - 200) { doc.addPage(); cursor = 50; }

//             fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
//             doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
//                .text("RESULT SUMMARY", LEFT + 10, cursor + 7, { lineBreak: false });
//             cursor += 32;

//             // 2-column metadata grid
//             const metaItems = [];
//             if (tr.rbc !== undefined)          metaItems.push(["RBC Value",        `${tr.rbc} ${tr.unit || ""}`]);
//             if (tr.remarks)                    metaItems.push(["Remarks",          tr.remarks]);
//             if (tr.isCritical !== undefined)   metaItems.push(["Critical Flag",    tr.isCritical ? "⚠ YES" : "No"]);
//             if (tr.verifiedBy)                 metaItems.push(["Verified By",      tr.verifiedBy]);
//             if (tr.collectedAt)                metaItems.push(["Collected At",     new Date(tr.collectedAt).toLocaleString("en-IN")]);
//             if (tr.referenceRange)             metaItems.push(["Reference Range",  `${tr.referenceRange.min} – ${tr.referenceRange.max} ${tr.unit || ""}`]);

//             const halfW = PAGE_W / 2 - 10;
//             metaItems.forEach(([label, value], i) => {
//                 const col = i % 2;
//                 const x   = LEFT + col * (halfW + 20);
//                 const row = Math.floor(i / 2);
//                 const y   = cursor + row * 38;

//                 fillRect(x, y, halfW, 32, LGRAY);
//                 doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                    .text(label.toUpperCase(), x + 8, y + 6, { lineBreak: false });
//                 const isCriticalValue = label === "Critical Flag" && value.startsWith("⚠");
//                 doc.fillColor(isCriticalValue ? DANGER : BLACK)
//                    .fontSize(11).font("Helvetica-Bold")
//                    .text(String(value), x + 8, y + 16, { lineBreak: false, width: halfW - 16 });
//             });

//             cursor += Math.ceil(metaItems.length / 2) * 38 + 12;

//             // ── Previous values trend bar ─────────────────────────────
//             if (Array.isArray(tr.previousValues) && tr.previousValues.length > 0) {
//                 if (cursor > doc.page.height - 160) { doc.addPage(); cursor = 50; }

//                 cursor += 10;
//                 fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
//                 doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
//                    .text("TREND — PREVIOUS VALUES", LEFT + 10, cursor + 7, { lineBreak: false });
//                 cursor += 32;

//                 const allVals  = [...tr.previousValues, tr.rbc].filter(v => v !== undefined);
//                 const minVal   = Math.min(...allVals) * 0.9;
//                 const maxVal   = Math.max(...allVals) * 1.1;
//                 const chartH   = 70;
//                 const chartW   = PAGE_W - 20;
//                 const chartX   = LEFT + 10;
//                 const chartY   = cursor;

//                 // Background
//                 fillRect(chartX, chartY, chartW, chartH, LGRAY);

//                 // Reference range band
//                 if (tr.referenceRange) {
//                     const refMinY = chartY + chartH - ((tr.referenceRange.min - minVal) / (maxVal - minVal)) * chartH;
//                     const refMaxY = chartY + chartH - ((tr.referenceRange.max - minVal) / (maxVal - minVal)) * chartH;
//                     doc.save()
//                        .rect(chartX, refMaxY, chartW, refMinY - refMaxY)
//                        .fill("#D5F5E3").restore();
//                 }

//                 // Plot points and line
//                 const points = allVals.map((v, i) => ({
//                     x: chartX + 30 + i * ((chartW - 60) / (allVals.length - 1 || 1)),
//                     y: chartY + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH
//                 }));

//                 // Draw connecting line
//                 doc.save().lineWidth(1.5).strokeColor(TEAL);
//                 points.forEach((p, i) => {
//                     if (i === 0) doc.moveTo(p.x, p.y);
//                     else         doc.lineTo(p.x, p.y);
//                 });
//                 doc.stroke().restore();

//                 // Draw points
//                 points.forEach((p, i) => {
//                     const isLast   = i === points.length - 1;
//                     const dotColor = isLast ? NAVY : TEAL;
//                     doc.save().circle(p.x, p.y, isLast ? 5 : 3.5).fill(dotColor).restore();

//                     // Value label above point
//                     const label = String(allVals[i]);
//                     doc.fillColor(isLast ? NAVY : TEAL).fontSize(8).font("Helvetica-Bold")
//                        .text(label, p.x - 10, p.y - 14, { lineBreak: false, width: 30, align: "center" });
//                 });

//                 // X-axis labels
//                 const xLabels = tr.previousValues.map((_, i) => `Visit ${i + 1}`);
//                 xLabels.push("Current");
//                 points.forEach((p, i) => {
//                     doc.fillColor(GRAY).fontSize(7).font("Helvetica")
//                        .text(xLabels[i], p.x - 15, chartY + chartH + 4, { lineBreak: false, width: 34, align: "center" });
//                 });

//                 cursor += chartH + 22;

//                 // Legend
//                 doc.save().rect(chartX, cursor, 12, 10).fill("#D5F5E3").restore();
//                 doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                    .text("Reference range", chartX + 16, cursor + 1, { lineBreak: false });
//                 cursor += 18;
//             }
//         }

//         // ════════════════════════════════════════════════════════════════
//         // FOOTER
//         // ════════════════════════════════════════════════════════════════
//         const footerY = doc.page.height - 55;
//         hRule(footerY, TEAL, 1);
//         fillRect(0, footerY + 1, doc.page.width, 54, NAVY);

//         doc.fillColor(WHITE).fontSize(8).font("Helvetica")
//            .text(
//                "This report is generated electronically and is valid without a signature. For queries contact your lab. Confidential — for patient use only.",
//                LEFT, footerY + 12, { width: PAGE_W, align: "center" }
//            );
//         doc.fillColor(TEAL).fontSize(8).font("Helvetica")
//            .text("MediLab Diagnostics  •  www.medilab.in  •  support@medilab.in", LEFT, footerY + 30, {
//                width: PAGE_W, align: "center"
//            });

//         doc.end();
//     });
// };

// Save PDF to local file system

const generatePatientReportPDF = async (report) => {
    const resolveLabName = async (reportData) => {
        if (reportData?.labName) {
            return reportData.labName;
        }

        if (!reportData?.labId) {
            return "Queueless";
        }

        try {
            const owner = await LaboratoryOwner.findById(reportData.labId).lean();
            return owner?.labName || "Queueless";
        } catch (error) {
            console.error("Failed to resolve lab name for PDF:", error.message);
            return "Queueless";
        }
    };

    const labName = await resolveLabName(report);

    return new Promise((resolve, reject) => {
        const fileName = `report-${Date.now()}.pdf`;
        // bottom margin is 0 on purpose: PDFKit auto-inserts a new page any time
        // text is drawn below the page's bottom margin, even with absolute x/y
        // coordinates. We lay out header/footer/content manually via
        // CONTENT_BOTTOM_LIMIT etc., so we don't want PDFKit's own margin
        // policing interfering (that's what was causing the extra blank pages).
        const doc = new PDFDocument({ margins: { top: 50, bottom: 0, left: 50, right: 50 }, size: "A4" });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve({ fileName, buffer: Buffer.concat(buffers) }));
        doc.on("error", reject);

        const NAVY = "#1A2B4A";
        const TEAL = "#0B7B8C";
        const TEAL_LT = "#E6F4F6";
        const GRAY = "#6B7280";
        const LGRAY = "#F3F4F6";
        const WHITE = "#FFFFFF";
        const BLACK = "#111827";
        const PAGE_W = doc.page.width - 100;
        const LEFT = 50;

        // ---------------------------------------------------------------
        // HEADER / FOOTER CONFIG
        // Today these render drawn shapes + text. Later, just pass an
        // image (Buffer, base64 data-url, or file path) via
        // report.headerImage / report.footerImage and this same call
        // site (renderHeader / renderFooter) will switch to doc.image()
        // automatically — nothing else in the file needs to change.
        // ---------------------------------------------------------------
        const HEADER_HEIGHT = 90;
        const FOOTER_HEIGHT = 50;
        const CONTENT_BOTTOM_LIMIT = doc.page.height - FOOTER_HEIGHT - 20; // leave room for footer

        const HEADER_IMAGE = report.headerImage || null; // Buffer | base64 string | file path
        const FOOTER_IMAGE = report.footerImage || null;

        // ---------------------------------------------------------------
        // BRAND MARK (small logo used in the footer, independent of the
        // full-banner HEADER_IMAGE/FOOTER_IMAGE swap above).
        // Ship the real PNG at <project>/assets/queueless-logo.png (or pass
        // report.logoPath) and it renders automatically. If it's missing —
        // e.g. not deployed yet — we fall back to a drawn teal circle + "Q"
        // so the footer never looks broken while you wire the asset up.
        // ---------------------------------------------------------------
        const LOGO_PATH = report.logoPath || path.join(__dirname, "assets", "queueless-logo.png");
        const LOGO_AVAILABLE = (() => {
            try {
                return fs.existsSync(LOGO_PATH);
            } catch {
                return false;
            }
        })();

        const drawBrandMark = (x, y, size = 14) => {
            if (LOGO_AVAILABLE) {
                doc.image(LOGO_PATH, x, y, { width: size, height: size });
                return;
            }
            doc.save().circle(x + size / 2, y + size / 2, size / 2).fill(TEAL).restore();
            doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(size * 0.62)
                .text("Q", x, y + size * 0.2, { width: size, align: "center", lineBreak: false });
        };

        const hRule = (y, color = TEAL, thickness = 1) => {
            doc.save()
                .moveTo(LEFT, y)
                .lineTo(LEFT + PAGE_W, y)
                .lineWidth(thickness)
                .strokeColor(color)
                .stroke()
                .restore();
        };

        const fillRect = (x, y, w, h, color) => {
            doc.save().rect(x, y, w, h).fill(color).restore();
        };

        const stringify = (value) => {
            if (value === null || value === undefined) return "—";
            if (typeof value === "string") return value;
            if (typeof value === "number" || typeof value === "boolean") return String(value);
            if (value instanceof Date) return value.toISOString();
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        };

        const normalizeResultObject = (value) => {
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            return value;
        };

        // ---------------------------------------------------------------
        // renderHeader: draws the top banner + patient/report info strip.
        // If HEADER_IMAGE is set, it just stamps the image across the
        // header band instead (full width, fixed height) and skips the
        // drawn version. Swap the fit/align options as needed once you
        // have real header art.
        // ---------------------------------------------------------------
        const renderHeader = (pageNumber) => {
            if (HEADER_IMAGE) {
                doc.image(HEADER_IMAGE, 0, 0, {
                    fit: [doc.page.width, HEADER_HEIGHT],
                    align: "center",
                    valign: "center"
                });
                // Page number still needs to be dynamic, so it's kept as an overlay
                // even in image mode. Remove this if the image already encodes it.
                doc.fillColor(BLACK).fontSize(9).font("Helvetica")
                    .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, HEADER_HEIGHT - 20, { width: 80, align: "right" });
                return;
            }

            fillRect(0, 0, doc.page.width, HEADER_HEIGHT, NAVY);
            doc.fillColor(WHITE).fontSize(22).font("Helvetica-Bold")
                .text(labName, LEFT, 20, { lineBreak: false });
            doc.fillColor(TEAL).fontSize(10).font("Helvetica")
                .text("Accredited Clinical Laboratory • ISO 15189 Certified", LEFT, 48, { lineBreak: false });
            doc.fillColor(WHITE).fontSize(9).font("Helvetica")
                .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, 24, { width: 80, align: "right" });

            // doc.fillColor(WHITE).fontSize(9).font("Helvetica")
            //     .text(`Report ID: ${report.reportId || "N/A"}`, LEFT + PAGE_W - 220, 44, { width: 210, align: "right" });
            doc.fillColor(WHITE).fontSize(9).font("Helvetica")
                .text(`Report Date: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString("en-IN") : "N/A"}`, LEFT + PAGE_W - 220, 58, { width: 210, align: "right" });

            fillRect(0, HEADER_HEIGHT, doc.page.width, 80, TEAL_LT);
            hRule(HEADER_HEIGHT, TEAL, 2);
            hRule(170, TEAL, 0.5);

            const infoFields = [
                ["Report Date", report.reportDate ? new Date(report.reportDate).toLocaleDateString("en-IN") : "N/A"],
                ["Tests", `${Array.isArray(report.testReport) ? report.testReport.length : 0}`]
            ];
            const colW = PAGE_W / infoFields.length;
            infoFields.forEach(([label, value], i) => {
                const x = LEFT + i * colW;
                doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                    .text(label.toUpperCase(), x, 100, { lineBreak: false });
                doc.fillColor(BLACK).fontSize(12).font("Helvetica-Bold")
                    .text(value, x, 114, { lineBreak: false });
            });

            const patientInfoFields = [
                ["Patient", report.patientName || "N/A"],
                ["Mobile", report.mobileNumber || "N/A"],
                ["Gender", report.gender || "N/A"],
                ["Age", report.age || "N/A"]
            ];
            const patientColW = PAGE_W / patientInfoFields.length;
            patientInfoFields.forEach(([label, value], i) => {
                const x = LEFT + i * patientColW;
                doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                    .text(label.toUpperCase(), x, 140, { lineBreak: false });
                doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
                    .text(value, x, 152, { lineBreak: false });
            });
        };

        // ---------------------------------------------------------------
        // renderFooter: draws a fixed-position footer band at the bottom
        // of whatever the current page is. Same image swap pattern as
        // the header — pass report.footerImage later and this takes over.
        // ---------------------------------------------------------------
        const renderFooter = (pageNumber, totalPages) => {
            const footerTop = doc.page.height - FOOTER_HEIGHT;

            if (FOOTER_IMAGE) {
                doc.image(FOOTER_IMAGE, 0, footerTop, {
                    fit: [doc.page.width, FOOTER_HEIGHT],
                    align: "center",
                    valign: "center"
                });
                doc.fillColor(BLACK).fontSize(8).font("Helvetica")
                    .text(`Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`, LEFT, doc.page.height - 18, {
                        width: PAGE_W,
                        align: "right"
                    });
                return;
            }

            hRule(footerTop, TEAL, 0.5);

            const brandY = footerTop + 10;
            drawBrandMark(LEFT, brandY - 1, 13);
            doc.fillColor(NAVY).fontSize(9).font("Helvetica-Bold")
                .text(labName, LEFT + 18, brandY, { lineBreak: false });

            doc.fillColor(GRAY).fontSize(7).font("Helvetica")
                .text(
                    "This is a computer-generated report and does not require a physical signature.",
                    LEFT,
                    footerTop + 26,
                    { width: PAGE_W - 100, lineBreak: false }
                );

            doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                .text(
                    `Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`,
                    LEFT + PAGE_W - 100,
                    brandY,
                    { width: 100, align: "right" }
                );
        };

        // Combines header + footer for the page currently open.
        // Footer is drawn immediately because it's a fixed-position
        // element that doesn't depend on how much content follows.
        const renderPageChrome = (pageNumber, totalPages) => {
            renderHeader(pageNumber);
            renderFooter(pageNumber, totalPages);
        };

        const metadataFields = [
            'unit',
            'isCritical',
            'referenceRange',
            'remarks',
            'previousValues',
            'collectedAt',
            'verifiedBy'
        ];

        const buildParameterRows = (test) => {
            if (Array.isArray(test.testParameters) && test.testParameters.length > 0) {
                return test.testParameters.map((param) => ({
                    parameterName: stringify(param.parameterName || param.name || param.parameter || ""),
                    value: stringify(param.value),
                    unit: stringify(param.unit || ""),
                    referenceRange: stringify(param.referenceRange || ""),
                    status: stringify(param.status || "PENDING")
                }));
            }

            if (test.testResult && typeof test.testResult === "object") {
                const resultObj = normalizeResultObject(test.testResult);
                const measurementKeys = Object.keys(resultObj).filter(key => !metadataFields.includes(key));
                const defaultUnit = stringify(resultObj.unit || "");
                const status = resultObj.isCritical ? "CRITICAL" : "NORMAL";

                return measurementKeys.map((key) => ({
                    parameterName: stringify(key),
                    value: stringify(resultObj[key]),
                    unit: defaultUnit,
                    referenceRange: stringify(resultObj.referenceRange || ""),
                    status
                }));
            }

            return [];
        };

        const buildResultMetadata = (test) => {
            if (!test.testResult || typeof test.testResult !== "object") {
                return [];
            }

            const resultObj = normalizeResultObject(test.testResult);
            return [
                ['Unit', stringify(resultObj.unit || "")],
                ['Critical', stringify(resultObj.isCritical !== undefined ? resultObj.isCritical : "")],
                ['Reference Range', resultObj.referenceRange ? `${stringify(resultObj.referenceRange.min)} - ${stringify(resultObj.referenceRange.max)}` : ""],
                ['Remarks', stringify(resultObj.remarks || "")],
                ['Previous Values', Array.isArray(resultObj.previousValues) ? resultObj.previousValues.map(stringify).join(', ') : stringify(resultObj.previousValues || "")],
                ['Collected At', resultObj.collectedAt ? moment(resultObj.collectedAt).format('DD-MM-YYYY') : ""],
                ['Verified By', stringify(resultObj.verifiedBy || "")],
            ].filter(([, value]) => value !== "" && value !== "—");
        };

        // pageNumber is tracked manually (not test index) since a single
        // test's table can overflow onto multiple pages.
        let pageNumber = 1;

        const goToNewPage = () => {
            doc.addPage();
            pageNumber += 1;
            renderPageChrome(pageNumber);
        };

        const renderTestSection = (test, index, totalTests) => {
            let cursor = 175;
            fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
            doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
                .text(`TEST ${index + 1}/${totalTests} - ${(test.testName || "Lab Test").toUpperCase()}`, LEFT + 10, cursor + 7, { lineBreak: false });
            cursor += 40;

            const rows = buildParameterRows(test);
            if (rows.length === 0) {
                doc.fillColor(GRAY).fontSize(11).font("Helvetica")
                    .text("No parameter data recorded.", LEFT, cursor);
                return;
            }

            fillRect(LEFT, cursor, PAGE_W, 18, LGRAY);
            doc.fillColor(BLACK).fontSize(8).font("Helvetica-Bold");
            doc.text("PARAMETER", LEFT + 8, cursor + 4, { lineBreak: false });
            doc.text("VALUE", LEFT + 180, cursor + 4, { lineBreak: false });
            doc.text("UNIT", LEFT + 260, cursor + 4, { lineBreak: false });
            doc.text("RANGE", LEFT + 345, cursor + 4, { lineBreak: false });
            doc.text("STATUS", LEFT + 460, cursor + 4, { lineBreak: false });
            cursor += 20;

            rows.forEach((row) => {
                const rowHeight = 20;
                if (cursor + rowHeight > CONTENT_BOTTOM_LIMIT) {
                    goToNewPage();
                    cursor = 175;
                }

                doc.fillColor(BLACK).fontSize(10).font("Helvetica")
                    .text(row.parameterName, LEFT + 8, cursor, { lineBreak: false, width: 160 });
                doc.fillColor(GRAY).fontSize(10).font("Helvetica")
                    .text(row.value, LEFT + 180, cursor, { lineBreak: false, width: 70 });
                doc.fillColor(GRAY).fontSize(10).font("Helvetica")
                    .text(row.unit, LEFT + 260, cursor, { lineBreak: false, width: 70 });
                doc.fillColor(GRAY).fontSize(10).font("Helvetica")
                    .text(row.referenceRange, LEFT + 345, cursor, { lineBreak: false, width: 100 });
                doc.fillColor(TEAL).fontSize(9).font("Helvetica-Bold")
                    .text(row.status, LEFT + 460, cursor, { lineBreak: false, width: 90 });
                cursor += rowHeight;
            });

            const metadataRows = buildResultMetadata(test);
            if (metadataRows.length > 0) {
                cursor += 10;
                if (cursor > CONTENT_BOTTOM_LIMIT) {
                    goToNewPage();
                    cursor = 175;
                }

                fillRect(LEFT, cursor, PAGE_W, 24, NAVY);
                doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
                    .text("RESULT METADATA", LEFT + 10, cursor + 7, { lineBreak: false });
                cursor += 32;

                metadataRows.forEach(([label, value]) => {
                    if (cursor > CONTENT_BOTTOM_LIMIT) {
                        goToNewPage();
                        cursor = 175;
                    }
                    doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                        .text(label, LEFT + 8, cursor, { lineBreak: false });
                    doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
                        .text(value, LEFT + 120, cursor, { lineBreak: false, width: PAGE_W - 120 });
                    cursor += 18;
                });
            }
        };

        const tests = Array.isArray(report.testReport) ? report.testReport : [];

        if (tests.length === 0) {
            renderPageChrome(pageNumber);
            doc.fillColor(GRAY).fontSize(12).font("Helvetica")
                .text("No test data available.", LEFT, 220);
        } else {
            tests.forEach((test, index) => {
                if (index > 0) {
                    goToNewPage();
                } else {
                    renderPageChrome(pageNumber);
                }
                renderTestSection(test, index, tests.length);
            });
        }

        doc.end();
    });
};

const savePatientReportPDFLocally = async (pdfBuffer, fileName) => {
    const fs = require('fs');
    const path = require('path');
    
    // Create uploads/reports directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, pdfBuffer, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    fileName,
                    filePath: filePath,
                    localPath: `/uploads/reports/${fileName}`, // Relative path for API response
                    fullPath: filePath
                });
            }
        });
    });
};

module.exports = {
    generatePatientReportPDF,
    savePatientReportPDFLocally
};