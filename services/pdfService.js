const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require("fs");
const path = require("path");
const LaboratoryOwner = require("../models/laboratoryOwner");

// Save PDF to local file system

const formatDateTime = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
};

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
        const CRITICAL_RED = "#B91C1C";
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
        // Info band now carries the full patient + registration block from
        // the wireframe (5 stacked lines per column), so it needs more room
        // than the old 2-row field grid did.
        const INFO_BAND_HEIGHT = 100;
        const TABLE_TOP = HEADER_HEIGHT + INFO_BAND_HEIGHT + 15;
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
            if (value === null || value === undefined || value === "") return "N/A";
            if (typeof value === "string") return value;
            if (typeof value === "number" || typeof value === "boolean") return String(value);
            if (value instanceof Date) return value.toISOString();
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        };

        // const formatDateTime = (value) => {
        //     if (!value) return "N/A";
        //     const d = new Date(value);
        //     if (Number.isNaN(d.getTime())) return stringify(value);
        //     return `${d.toLocaleDateString("en-IN")} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
        // };

        const normalizeResultObject = (value) => {
            if (value instanceof Map) {
                return Object.fromEntries(value);
            }
            return value;
        };

        // ---------------------------------------------------------------
        // renderHeader: draws the top banner, then the patient/registration
        // info band below it (two stacked columns, per the wireframe).
        // If HEADER_IMAGE is set, it stamps the image across the header
        // band instead and skips the drawn banner — the info band below
        // still renders normally either way.
        // ---------------------------------------------------------------
        const renderHeader = (pageNumber) => {
            if (HEADER_IMAGE) {
                doc.image(HEADER_IMAGE, 0, 0, {
                    fit: [doc.page.width, HEADER_HEIGHT],
                    align: "center",
                    valign: "center"
                });
                doc.fillColor(BLACK).fontSize(9).font("Helvetica")
                    .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, HEADER_HEIGHT - 20, { width: 80, align: "right" });
            } else {
                fillRect(0, 0, doc.page.width, HEADER_HEIGHT, NAVY);
                doc.fillColor(WHITE).fontSize(22).font("Helvetica-Bold")
                    .text(labName, LEFT, 20, { lineBreak: false });
                doc.fillColor(TEAL).fontSize(10).font("Helvetica")
                    .text("Accredited Clinical Laboratory • ISO 15189 Certified", LEFT, 48, { lineBreak: false });
                doc.fillColor(WHITE).fontSize(9).font("Helvetica")
                    .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, 24, { width: 80, align: "right" });
                doc.fillColor(WHITE).fontSize(9).font("Helvetica")
                    .text(`Report Date: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString("en-IN") : "N/A"}`, LEFT + PAGE_W - 220, 58, { width: 210, align: "right" });
            }

            // ---- Info band: left = patient details, right = registration/referral details ----
            fillRect(0, HEADER_HEIGHT, doc.page.width, INFO_BAND_HEIGHT, TEAL_LT);
            hRule(HEADER_HEIGHT, TEAL, 2);
            hRule(HEADER_HEIGHT + INFO_BAND_HEIGHT, TEAL, 0.5);

            const colGap = 20;
            const colW = (PAGE_W - colGap) / 2;
            const leftX = LEFT;
            const rightX = LEFT + colW + colGap;
            const lineHeight = 16;
            let lineY = HEADER_HEIGHT + 12;

            const patientLines = [
                ["Patient", report.patientName],
                ["Age", report.age],
                ["Gender", report.gender],
                ["Address", report.address],
                ["Mobile", report.mobileNumber]
            ];

            // const registrationLines = [
            //     ["Reg. Number", report.regNumber],
            //     ["Reg. Date & Time", formatDateTime(report.regDateTime)],
            //     ["Report Date & Time", formatDateTime(report.reportDate)],
            //     ["Referred By", report.referredBy ? (/^dr\.?\s/i.test(String(report.referredBy)) ? String(report.referredBy) : `Dr. ${report.referredBy}`) : "N/A"],
            //     ["Ref. Doctor Contact", report.referredByContact]
            // ];

            const registrationLines = [
                ["Reg. Number", report.regNumber],
                ["Reg. Date & Time", formatDateTime(report.regDateTime)],
                ["Report Date & Time", formatDateTime(report.reportDate)],
                ["Referred By", report.referredBy 
                    ? (/^dr\.?\s/i.test(String(report.referredBy))
                        ? String(report.referredBy)
                        : `Dr. ${report.referredBy}`)
                    : "N/A"
                ],
                ["Ref. Doctor Contact", report.referredByContact]
            ];

            const maxLines = Math.max(patientLines.length, registrationLines.length);
            for (let i = 0; i < maxLines; i += 1) {
                const y = lineY + i * lineHeight;
                if (patientLines[i]) {
                    const [label, value] = patientLines[i];
                    doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                        .text(`${label.toUpperCase()}`, leftX, y, { continued: false, lineBreak: false, width: 90 });
                    doc.fillColor(BLACK).fontSize(9).font("Helvetica-Bold")
                        .text(stringify(value), leftX + 95, y, { lineBreak: false, width: colW - 95 });
                }
                if (registrationLines[i]) {
                    const [label, value] = registrationLines[i];
                    doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                        .text(`${label.toUpperCase()}`, rightX, y, { continued: false, lineBreak: false, width: 110 });
                    doc.fillColor(BLACK).fontSize(9).font("Helvetica-Bold")
                        .text(stringify(value), rightX + 115, y, { lineBreak: false, width: colW - 115 });
                }
            }
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

        // ---------------------------------------------------------------
        // Normalizes a single parameter (leaf) into a display row.
        // ---------------------------------------------------------------
        const buildRow = (param) => ({
            parameterName: stringify(param.parameterName || param.name || param.parameter || ""),
            value: stringify(param.value),
            unit: stringify(param.unit || ""),
            referenceRange: stringify(param.referenceRange || ""),
            isCritical: Boolean(param.isCritical || param.status === "CRITICAL")
        });

        // ---------------------------------------------------------------
        // buildParameterGroups: turns test.testParameters into a flat list
        // of { row, indent, isGroupHeader } entries, expanding one level
        // of subParameters (e.g. RBC -> hb, rbc, hematocrit) as indented
        // children directly beneath their parent, matching the wireframe.
        //
        // A parameter with subParameters is rendered as a bold group
        // label (no value/unit/range of its own) followed by its indented
        // children. A parameter with no subParameters is rendered as a
        // normal top-level row.
        // ---------------------------------------------------------------
        const buildParameterGroups = (test) => {
            if (Array.isArray(test.testParameters) && test.testParameters.length > 0) {
                const entries = [];
                test.testParameters.forEach((param) => {
                    const hasChildren = Array.isArray(param.subParameters) && param.subParameters.length > 0;
                    if (hasChildren) {
                        entries.push({
                            isGroupHeader: true,
                            indent: 0,
                            label: stringify(param.parameterName || param.name || param.parameter || "")
                        });
                        param.subParameters.forEach((sub) => {
                            entries.push({ isGroupHeader: false, indent: 1, row: buildRow(sub) });
                        });
                    } else {
                        entries.push({ isGroupHeader: false, indent: 0, row: buildRow(param) });
                    }
                });
                return entries;
            }

            // Legacy fallback: flat testResult object (no hierarchy).
            if (test.testResult && typeof test.testResult === "object") {
                const resultObj = normalizeResultObject(test.testResult);
                const measurementKeys = Object.keys(resultObj).filter(key => !metadataFields.includes(key));
                const defaultUnit = stringify(resultObj.unit || "");
                const isCritical = Boolean(resultObj.isCritical);

                return measurementKeys.map((key) => ({
                    isGroupHeader: false,
                    indent: 0,
                    row: {
                        parameterName: stringify(key),
                        value: stringify(resultObj[key]),
                        unit: defaultUnit,
                        referenceRange: stringify(resultObj.referenceRange || ""),
                        isCritical
                    }
                }));
            }

            return [];
        };

        const buildResultMetadata = (test) => {
            if (!test.testResult || typeof test.testResult !== "object") {
                return [];
            }

            const resultObj = normalizeResultObject(test.testResult);

            // referenceRange may arrive as a string ("13 - 17"), or as an object
            // with any of {min,max} / {minValue,maxValue} / {from,to}. Only emit a
            // row when we actually have something — never "N/A - N/A".
            const formatRange = (rr) => {
                if (!rr) return "";
                if (typeof rr === "string") return rr.trim();
                if (typeof rr === "object") {
                    const min = rr.min ?? rr.minValue ?? rr.from;
                    const max = rr.max ?? rr.maxValue ?? rr.to;
                    if (min === undefined && max === undefined) return "";
                    return `${min ?? ""} - ${max ?? ""}`.trim();
                }
                return stringify(rr);
            };

            return [
                ['Unit', stringify(resultObj.unit || "")],
                ['Critical', stringify(resultObj.isCritical !== undefined ? resultObj.isCritical : "")],
                ['Reference Range', formatRange(resultObj.referenceRange)],
                ['Remarks', stringify(resultObj.remarks || "")],
                ['Previous Values', Array.isArray(resultObj.previousValues) ? resultObj.previousValues.map(stringify).join(', ') : stringify(resultObj.previousValues || "")],
                ['Collected At', resultObj.collectedAt ? moment(resultObj.collectedAt).format('DD-MM-YYYY') : ""],
                ['Verified By', stringify(resultObj.verifiedBy || "")],
            ].filter(([, value]) => value !== "" && value !== "N/A");
        };

        // pageNumber is tracked manually (not test index) since a single
        // test's table can overflow onto multiple pages.
        let pageNumber = 1;

        const goToNewPage = () => {
            doc.addPage();
            pageNumber += 1;
            renderPageChrome(pageNumber);
        };

        // Column x-positions for the 4-column table (Test Name / Results / Units / Ref Value)
        const COL_NAME_X = LEFT + 8;
        const COL_NAME_W = 220;
        const COL_VALUE_X = LEFT + 240;
        const COL_VALUE_W = 70;
        const COL_UNIT_X = LEFT + 320;
        const COL_UNIT_W = 70;
        const COL_RANGE_X = LEFT + 400;
        const COL_RANGE_W = 95;

        const renderTestSection = (test, index, totalTests) => {
            let cursor = TABLE_TOP;
            fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
            doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
                .text(`TEST ${index + 1}/${totalTests} - ${(test.testName || "Lab Test").toUpperCase()}`, LEFT + 10, cursor + 7, { lineBreak: false });
            cursor += 40;

            const entries = buildParameterGroups(test);
            if (entries.length === 0) {
                doc.fillColor(GRAY).fontSize(11).font("Helvetica")
                    .text("No parameter data recorded.", LEFT, cursor);
                return;
            }

            fillRect(LEFT, cursor, PAGE_W, 18, LGRAY);
            doc.fillColor(BLACK).fontSize(8).font("Helvetica-Bold");
            doc.text("TEST NAME", COL_NAME_X, cursor + 4, { lineBreak: false });
            doc.text("RESULTS", COL_VALUE_X, cursor + 4, { lineBreak: false });
            doc.text("UNITS", COL_UNIT_X, cursor + 4, { lineBreak: false });
            doc.text("REF VALUE", COL_RANGE_X, cursor + 4, { lineBreak: false });
            cursor += 20;

            entries.forEach((entry) => {
                const rowHeight = 20;
                if (cursor + rowHeight > CONTENT_BOTTOM_LIMIT) {
                    goToNewPage();
                    cursor = TABLE_TOP;
                }

                if (entry.isGroupHeader) {
                    // Parent parameter (e.g. "RBC") — name only, bold, no value/unit/range.
                    doc.fillColor(NAVY).fontSize(10).font("Helvetica-Bold")
                        .text(entry.label, COL_NAME_X, cursor, { lineBreak: false, width: COL_NAME_W });
                    cursor += rowHeight;
                    return;
                }

                const { row, indent } = entry;
                const indentPx = indent * 16;
                const nameLabel = indent > 0 ? `– ${row.parameterName}` : row.parameterName;
                const valueColor = row.isCritical ? CRITICAL_RED : GRAY;

                doc.fillColor(indent > 0 ? GRAY : BLACK).fontSize(10).font(indent > 0 ? "Helvetica" : "Helvetica")
                    .text(nameLabel, COL_NAME_X + indentPx, cursor, { lineBreak: false, width: COL_NAME_W - indentPx });
                doc.fillColor(valueColor).fontSize(10).font(row.isCritical ? "Helvetica-Bold" : "Helvetica")
                    .text(row.value, COL_VALUE_X, cursor, { lineBreak: false, width: COL_VALUE_W });
                doc.fillColor(GRAY).fontSize(10).font("Helvetica")
                    .text(row.unit, COL_UNIT_X, cursor, { lineBreak: false, width: COL_UNIT_W });
                doc.fillColor(GRAY).fontSize(10).font("Helvetica")
                    .text(row.referenceRange, COL_RANGE_X, cursor, { lineBreak: false, width: COL_RANGE_W });
                cursor += rowHeight;
            });

            const metadataRows = buildResultMetadata(test);
            if (metadataRows.length > 0) {
                cursor += 10;
                if (cursor > CONTENT_BOTTOM_LIMIT) {
                    goToNewPage();
                    cursor = TABLE_TOP;
                }

                // fillRect(LEFT, cursor, PAGE_W, 24, NAVY);
                // doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
                //     .text("RESULT METADATA", LEFT + 10, cursor + 7, { lineBreak: false });
                // cursor += 32;

                // metadataRows.forEach(([label, value]) => {
                //     if (cursor > CONTENT_BOTTOM_LIMIT) {
                //         goToNewPage();
                //         cursor = TABLE_TOP;
                //     }
                //     doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                //         .text(label, LEFT + 8, cursor, { lineBreak: false });
                //     doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
                //         .text(value, LEFT + 120, cursor, { lineBreak: false, width: PAGE_W - 120 });
                //     cursor += 18;
                // });
            }
        };

        const tests = Array.isArray(report.testReport) ? report.testReport : [];

        if (tests.length === 0) {
            renderPageChrome(pageNumber);
            doc.fillColor(GRAY).fontSize(12).font("Helvetica")
                .text("No test data available.", LEFT, TABLE_TOP);
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

// ---------------------------------------------------------------------
// EXPECTED report SHAPE (new fields per wireframe are marked ← NEW)
// ---------------------------------------------------------------------
// {
//   patientName: "Adit Zinzuvadia",
//   age: "28 years",
//   gender: "Male",
//   address: "Junagadh",                       // ← NEW
//   mobileNumber: "9999999999",
//   regNumber: "REG-2026-00123",                // ← NEW
//   regDateTime: "2026-08-04T09:15:00Z",         // ← NEW
//   reportDate: "2026-08-04T14:30:00Z",
//   referredBy: "Dr. XYZ",                      // ← NEW
//   referredByContact: "9888888888",             // ← NEW
//   testReport: [
//     {
//       testName: "Haemogram",
//       testParameters: [
//         {
//           parameterName: "RBC",
//           subParameters: [                     // ← NEW: nested sub-parameters
//             { parameterName: "HB", value: "13.5", unit: "g/dL", referenceRange: "13-17" },
//             { parameterName: "RBC Count", value: "4.8", unit: "mill/mm3", referenceRange: "4.5-5.5" },
//             { parameterName: "Hematocrit", value: "42", unit: "%", referenceRange: "40-50", isCritical: true }
//           ]
//         },
//         { parameterName: "WBC", value: "7200", unit: "/mm3", referenceRange: "4000-11000" }
//       ]
//     }
//   ]
// }

// const generatePatientReportPDF = async (report) => {
//     const resolveLabName = async (reportData) => {
//         if (reportData?.labName) {
//             return reportData.labName;
//         }

//         if (!reportData?.labId) {
//             return "Queueless";
//         }

//         try {
//             const owner = await LaboratoryOwner.findById(reportData.labId).lean();
//             return owner?.labName || "Queueless";
//         } catch (error) {
//             console.error("Failed to resolve lab name for PDF:", error.message);
//             return "Queueless";
//         }
//     };

//     const labName = await resolveLabName(report);

//     return new Promise((resolve, reject) => {
//         const fileName = `report-${Date.now()}.pdf`;
//         // bottom margin is 0 on purpose: PDFKit auto-inserts a new page any time
//         // text is drawn below the page's bottom margin, even with absolute x/y
//         // coordinates. We lay out header/footer/content manually via
//         // CONTENT_BOTTOM_LIMIT etc., so we don't want PDFKit's own margin
//         // policing interfering (that's what was causing the extra blank pages).
//         const doc = new PDFDocument({ margins: { top: 50, bottom: 0, left: 50, right: 50 }, size: "A4" });
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

//         // ---------------------------------------------------------------
//         // HEADER / FOOTER CONFIG
//         // Today these render drawn shapes + text. Later, just pass an
//         // image (Buffer, base64 data-url, or file path) via
//         // report.headerImage / report.footerImage and this same call
//         // site (renderHeader / renderFooter) will switch to doc.image()
//         // automatically — nothing else in the file needs to change.
//         // ---------------------------------------------------------------
//         const HEADER_HEIGHT = 90;
//         const FOOTER_HEIGHT = 50;
//         const CONTENT_BOTTOM_LIMIT = doc.page.height - FOOTER_HEIGHT - 20; // leave room for footer

//         const HEADER_IMAGE = report.headerImage || null; // Buffer | base64 string | file path
//         const FOOTER_IMAGE = report.footerImage || null;

//         // ---------------------------------------------------------------
//         // BRAND MARK (small logo used in the footer, independent of the
//         // full-banner HEADER_IMAGE/FOOTER_IMAGE swap above).
//         // Ship the real PNG at <project>/assets/queueless-logo.png (or pass
//         // report.logoPath) and it renders automatically. If it's missing —
//         // e.g. not deployed yet — we fall back to a drawn teal circle + "Q"
//         // so the footer never looks broken while you wire the asset up.
//         // ---------------------------------------------------------------
//         const LOGO_PATH = report.logoPath || path.join(__dirname, "assets", "queueless-logo.png");
//         const LOGO_AVAILABLE = (() => {
//             try {
//                 return fs.existsSync(LOGO_PATH);
//             } catch {
//                 return false;
//             }
//         })();

//         const drawBrandMark = (x, y, size = 14) => {
//             if (LOGO_AVAILABLE) {
//                 doc.image(LOGO_PATH, x, y, { width: size, height: size });
//                 return;
//             }
//             doc.save().circle(x + size / 2, y + size / 2, size / 2).fill(TEAL).restore();
//             doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(size * 0.62)
//                 .text("Q", x, y + size * 0.2, { width: size, align: "center", lineBreak: false });
//         };

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

//         // ---------------------------------------------------------------
//         // renderHeader: draws the top banner + patient/report info strip.
//         // If HEADER_IMAGE is set, it just stamps the image across the
//         // header band instead (full width, fixed height) and skips the
//         // drawn version. Swap the fit/align options as needed once you
//         // have real header art.
//         // ---------------------------------------------------------------
//         const renderHeader = (pageNumber) => {
//             if (HEADER_IMAGE) {
//                 doc.image(HEADER_IMAGE, 0, 0, {
//                     fit: [doc.page.width, HEADER_HEIGHT],
//                     align: "center",
//                     valign: "center"
//                 });
//                 // Page number still needs to be dynamic, so it's kept as an overlay
//                 // even in image mode. Remove this if the image already encodes it.
//                 doc.fillColor(BLACK).fontSize(9).font("Helvetica")
//                     .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, HEADER_HEIGHT - 20, { width: 80, align: "right" });
//                 return;
//             }

//             fillRect(0, 0, doc.page.width, HEADER_HEIGHT, NAVY);
//             doc.fillColor(WHITE).fontSize(22).font("Helvetica-Bold")
//                 .text(labName, LEFT, 20, { lineBreak: false });
//             doc.fillColor(TEAL).fontSize(10).font("Helvetica")
//                 .text("Accredited Clinical Laboratory • ISO 15189 Certified", LEFT, 48, { lineBreak: false });
//             doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//                 .text(`Page ${pageNumber}`, LEFT + PAGE_W - 80, 24, { width: 80, align: "right" });

//             // doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//             //     .text(`Report ID: ${report.reportId || "N/A"}`, LEFT + PAGE_W - 220, 44, { width: 210, align: "right" });
//             doc.fillColor(WHITE).fontSize(9).font("Helvetica")
//                 .text(`Report Date: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString("en-IN") : "N/A"}`, LEFT + PAGE_W - 220, 58, { width: 210, align: "right" });

//             fillRect(0, HEADER_HEIGHT, doc.page.width, 80, TEAL_LT);
//             hRule(HEADER_HEIGHT, TEAL, 2);
//             hRule(170, TEAL, 0.5);

//             const infoFields = [
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

//         // ---------------------------------------------------------------
//         // renderFooter: draws a fixed-position footer band at the bottom
//         // of whatever the current page is. Same image swap pattern as
//         // the header — pass report.footerImage later and this takes over.
//         // ---------------------------------------------------------------
//         const renderFooter = (pageNumber, totalPages) => {
//             const footerTop = doc.page.height - FOOTER_HEIGHT;

//             if (FOOTER_IMAGE) {
//                 doc.image(FOOTER_IMAGE, 0, footerTop, {
//                     fit: [doc.page.width, FOOTER_HEIGHT],
//                     align: "center",
//                     valign: "center"
//                 });
//                 doc.fillColor(BLACK).fontSize(8).font("Helvetica")
//                     .text(`Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`, LEFT, doc.page.height - 18, {
//                         width: PAGE_W,
//                         align: "right"
//                     });
//                 return;
//             }

//             hRule(footerTop, TEAL, 0.5);

//             const brandY = footerTop + 10;
//             drawBrandMark(LEFT, brandY - 1, 13);
//             doc.fillColor(NAVY).fontSize(9).font("Helvetica-Bold")
//                 .text(labName, LEFT + 18, brandY, { lineBreak: false });

//             doc.fillColor(GRAY).fontSize(7).font("Helvetica")
//                 .text(
//                     "This is a computer-generated report and does not require a physical signature.",
//                     LEFT,
//                     footerTop + 26,
//                     { width: PAGE_W - 100, lineBreak: false }
//                 );

//             doc.fillColor(GRAY).fontSize(8).font("Helvetica")
//                 .text(
//                     `Page ${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`,
//                     LEFT + PAGE_W - 100,
//                     brandY,
//                     { width: 100, align: "right" }
//                 );
//         };

//         // Combines header + footer for the page currently open.
//         // Footer is drawn immediately because it's a fixed-position
//         // element that doesn't depend on how much content follows.
//         const renderPageChrome = (pageNumber, totalPages) => {
//             renderHeader(pageNumber);
//             renderFooter(pageNumber, totalPages);
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

//         // pageNumber is tracked manually (not test index) since a single
//         // test's table can overflow onto multiple pages.
//         let pageNumber = 1;

//         const goToNewPage = () => {
//             doc.addPage();
//             pageNumber += 1;
//             renderPageChrome(pageNumber);
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
//                 if (cursor + rowHeight > CONTENT_BOTTOM_LIMIT) {
//                     goToNewPage();
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
//                 if (cursor > CONTENT_BOTTOM_LIMIT) {
//                     goToNewPage();
//                     cursor = 175;
//                 }

//                 fillRect(LEFT, cursor, PAGE_W, 24, NAVY);
//                 doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
//                     .text("RESULT METADATA", LEFT + 10, cursor + 7, { lineBreak: false });
//                 cursor += 32;

//                 metadataRows.forEach(([label, value]) => {
//                     if (cursor > CONTENT_BOTTOM_LIMIT) {
//                         goToNewPage();
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
//             renderPageChrome(pageNumber);
//             doc.fillColor(GRAY).fontSize(12).font("Helvetica")
//                 .text("No test data available.", LEFT, 220);
//         } else {
//             tests.forEach((test, index) => {
//                 if (index > 0) {
//                     goToNewPage();
//                 } else {
//                     renderPageChrome(pageNumber);
//                 }
//                 renderTestSection(test, index, tests.length);
//             });
//         }

//         doc.end();
//     });
// };

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