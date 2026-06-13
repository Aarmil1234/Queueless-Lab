const PDFDocument = require('pdfkit');

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

const generatePatientReportPDF = async (report) => {
    return new Promise((resolve, reject) => {
        const fileName = `report-${Date.now()}.pdf`;
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve({ fileName, buffer: Buffer.concat(buffers) }));
        doc.on("error", reject);

        // ─── Color palette ───────────────────────────────────────────────
        const NAVY    = "#1A2B4A";
        const TEAL    = "#0B7B8C";
        const TEAL_LT = "#E6F4F6";
        const DANGER  = "#C0392B";
        const WARN    = "#E67E22";
        const OK      = "#1E8449";
        const GRAY    = "#6B7280";
        const LGRAY   = "#F3F4F6";
        const WHITE   = "#FFFFFF";
        const BLACK   = "#111827";

        const PAGE_W  = doc.page.width  - 100; // usable width (50px margin each side)
        const LEFT    = 50;

        // ─── Helper: horizontal rule ─────────────────────────────────────
        const hRule = (y, color = TEAL, thickness = 1) => {
            doc.save()
               .moveTo(LEFT, y).lineTo(LEFT + PAGE_W, y)
               .lineWidth(thickness).strokeColor(color).stroke()
               .restore();
        };

        // ─── Helper: filled rect ─────────────────────────────────────────
        const fillRect = (x, y, w, h, color) => {
            doc.save().rect(x, y, w, h).fill(color).restore();
        };

        // ─── Helper: status badge ─────────────────────────────────────────
        const badge = (x, y, label, color) => {
            const PAD = 5;
            doc.fontSize(8).font("Helvetica-Bold");
            const tw = doc.widthOfString(label);
            doc.save()
               .roundedRect(x, y - 1, tw + PAD * 2, 14, 3)
               .fill(color);
            doc.fillColor(WHITE).text(label, x + PAD, y + 1, { lineBreak: false });
            doc.restore();
        };

        // ════════════════════════════════════════════════════════════════
        // HEADER BAND
        // ════════════════════════════════════════════════════════════════
        fillRect(0, 0, doc.page.width, 90, NAVY);

        // Logo placeholder / Lab name
        doc.fillColor(WHITE)
           .fontSize(22).font("Helvetica-Bold")
           .text("Queueless", LEFT, 20, { lineBreak: false });

        doc.fillColor(TEAL).fontSize(10).font("Helvetica")
           .text("Accredited Clinical Laboratory  •  ISO 15189 Certified", LEFT, 48, { lineBreak: false });

        // Report ID top-right
        const reportDate = report.testResult?.collectedAt
            ? new Date(report.testResult.collectedAt).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric"
              })
            : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

        doc.fillColor(WHITE).fontSize(9).font("Helvetica")
           .text(`Report Date: ${reportDate}`, LEFT + PAGE_W - 120, 25, { lineBreak: false, width: 130, align: "right" })
           .text(`Generated: ${new Date().toLocaleString("en-IN")}`, LEFT + PAGE_W - 120, 40, { lineBreak: false, width: 130, align: "right" });

        // ════════════════════════════════════════════════════════════════
        // PATIENT INFO STRIP
        // ════════════════════════════════════════════════════════════════
        fillRect(0, 90, doc.page.width, 55, TEAL_LT);
        hRule(90, TEAL, 2);
        hRule(145, TEAL, 0.5);

        const infoFields = [
            ["Patient Name",   report.patientName   || "N/A"],
            ["Mobile",         report.mobileNumber  || "N/A"],
            ["Gender",         report.gender        || "N/A"],
        ];

        const colW = PAGE_W / infoFields.length;
        infoFields.forEach(([label, value], i) => {
            const x = LEFT + i * colW;
            doc.fillColor(GRAY).fontSize(8).font("Helvetica")
               .text(label.toUpperCase(), x, 100, { lineBreak: false });
            doc.fillColor(BLACK).fontSize(12).font("Helvetica-Bold")
               .text(value, x, 114, { lineBreak: false });
        });

        // ════════════════════════════════════════════════════════════════
        // SECTION: TEST RESULTS
        // ════════════════════════════════════════════════════════════════
        let cursor = 165;

        // Section heading
        fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
        doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
           .text("TEST RESULTS", LEFT + 10, cursor + 7, { lineBreak: false });
        cursor += 24;

        const tests = Array.isArray(report.testReport) ? report.testReport : [];

        if (tests.length === 0) {
            doc.fillColor(GRAY).fontSize(12).font("Helvetica")
               .text("No test data available.", LEFT, cursor + 10);
        }

        tests.forEach((test) => {
            // Test name sub-header
            cursor += 12;
            doc.fillColor(NAVY).fontSize(13).font("Helvetica-Bold")
               .text(test.testName || "Lab Test", LEFT, cursor);
            cursor += 18;
            hRule(cursor, NAVY, 0.5);
            cursor += 8;

            // Table header row
            const COL = { param: LEFT, value: LEFT + 200, unit: LEFT + 290, range: LEFT + 370, status: LEFT + 470 };
            fillRect(LEFT, cursor, PAGE_W, 18, LGRAY);
            doc.fillColor(GRAY).fontSize(8).font("Helvetica-Bold");
            doc.text("PARAMETER",   COL.param,  cursor + 5, { lineBreak: false });
            doc.text("RESULT",      COL.value,  cursor + 5, { lineBreak: false });
            doc.text("UNIT",        COL.unit,   cursor + 5, { lineBreak: false });
            doc.text("REF. RANGE",  COL.range,  cursor + 5, { lineBreak: false });
            doc.text("STATUS",      COL.status, cursor + 5, { lineBreak: false });
            cursor += 18;
            hRule(cursor, LGRAY);

            const params = Array.isArray(test.testParameters) ? test.testParameters : [];

            if (params.length === 0) {
                cursor += 8;
                doc.fillColor(GRAY).fontSize(10).font("Helvetica")
                   .text("No parameters recorded.", LEFT, cursor);
                cursor += 20;
            } else {
                params.forEach((param, idx) => {
                    const rowH = 22;
                    if (idx % 2 === 0) fillRect(LEFT, cursor, PAGE_W, rowH, "#FAFAFA");

                    const val    = param.value ?? "";
                    const minRef = param.referenceRange?.min;
                    const maxRef = param.referenceRange?.max;

                    // Determine status
                    let statusLabel = "—";
                    let statusColor = GRAY;
                    if (param.isCritical) {
                        statusLabel = "CRITICAL";
                        statusColor = DANGER;
                    } else if (typeof val === "number" && minRef !== undefined && maxRef !== undefined) {
                        if (val < minRef)       { statusLabel = "LOW";    statusColor = WARN;  }
                        else if (val > maxRef)  { statusLabel = "HIGH";   statusColor = DANGER; }
                        else                    { statusLabel = "NORMAL"; statusColor = OK;    }
                    } else if (param.remarks) {
                        statusLabel = param.remarks.toUpperCase().slice(0, 8);
                        statusColor = OK;
                    }

                    // Highlight value red if critical or out-of-range
                    const valColor = (statusLabel === "LOW" || statusLabel === "HIGH" || statusLabel === "CRITICAL")
                        ? DANGER : BLACK;

                    doc.fillColor(BLACK).fontSize(10).font("Helvetica-Bold")
                       .text(param.parameterName || "—", COL.param, cursor + 6, { lineBreak: false, width: 195 });

                    doc.fillColor(valColor).fontSize(10).font("Helvetica-Bold")
                       .text(String(val), COL.value, cursor + 6, { lineBreak: false });

                    doc.fillColor(GRAY).fontSize(9).font("Helvetica")
                       .text(param.unit || "—", COL.unit, cursor + 6, { lineBreak: false });

                    const refStr = (minRef !== undefined && maxRef !== undefined)
                        ? `${minRef} – ${maxRef}` : "—";
                    doc.fillColor(GRAY).fontSize(9).font("Helvetica")
                       .text(refStr, COL.range, cursor + 6, { lineBreak: false });

                    badge(COL.status, cursor + 6, statusLabel, statusColor);

                    cursor += rowH;
                    hRule(cursor, "#E5E7EB", 0.3);
                });
            }

            cursor += 10;
        });

        // ════════════════════════════════════════════════════════════════
        // SECTION: TEST RESULT METADATA (from testResult object)
        // ════════════════════════════════════════════════════════════════
        const tr = report.testResult;
        if (tr) {
            cursor += 10;

            // Check page space — add page if needed
            if (cursor > doc.page.height - 200) { doc.addPage(); cursor = 50; }

            fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
            doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
               .text("RESULT SUMMARY", LEFT + 10, cursor + 7, { lineBreak: false });
            cursor += 32;

            // 2-column metadata grid
            const metaItems = [];
            if (tr.rbc !== undefined)          metaItems.push(["RBC Value",        `${tr.rbc} ${tr.unit || ""}`]);
            if (tr.remarks)                    metaItems.push(["Remarks",          tr.remarks]);
            if (tr.isCritical !== undefined)   metaItems.push(["Critical Flag",    tr.isCritical ? "⚠ YES" : "No"]);
            if (tr.verifiedBy)                 metaItems.push(["Verified By",      tr.verifiedBy]);
            if (tr.collectedAt)                metaItems.push(["Collected At",     new Date(tr.collectedAt).toLocaleString("en-IN")]);
            if (tr.referenceRange)             metaItems.push(["Reference Range",  `${tr.referenceRange.min} – ${tr.referenceRange.max} ${tr.unit || ""}`]);

            const halfW = PAGE_W / 2 - 10;
            metaItems.forEach(([label, value], i) => {
                const col = i % 2;
                const x   = LEFT + col * (halfW + 20);
                const row = Math.floor(i / 2);
                const y   = cursor + row * 38;

                fillRect(x, y, halfW, 32, LGRAY);
                doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                   .text(label.toUpperCase(), x + 8, y + 6, { lineBreak: false });
                const isCriticalValue = label === "Critical Flag" && value.startsWith("⚠");
                doc.fillColor(isCriticalValue ? DANGER : BLACK)
                   .fontSize(11).font("Helvetica-Bold")
                   .text(String(value), x + 8, y + 16, { lineBreak: false, width: halfW - 16 });
            });

            cursor += Math.ceil(metaItems.length / 2) * 38 + 12;

            // ── Previous values trend bar ─────────────────────────────
            if (Array.isArray(tr.previousValues) && tr.previousValues.length > 0) {
                if (cursor > doc.page.height - 160) { doc.addPage(); cursor = 50; }

                cursor += 10;
                fillRect(LEFT, cursor, PAGE_W, 24, TEAL);
                doc.fillColor(WHITE).fontSize(11).font("Helvetica-Bold")
                   .text("TREND — PREVIOUS VALUES", LEFT + 10, cursor + 7, { lineBreak: false });
                cursor += 32;

                const allVals  = [...tr.previousValues, tr.rbc].filter(v => v !== undefined);
                const minVal   = Math.min(...allVals) * 0.9;
                const maxVal   = Math.max(...allVals) * 1.1;
                const chartH   = 70;
                const chartW   = PAGE_W - 20;
                const chartX   = LEFT + 10;
                const chartY   = cursor;

                // Background
                fillRect(chartX, chartY, chartW, chartH, LGRAY);

                // Reference range band
                if (tr.referenceRange) {
                    const refMinY = chartY + chartH - ((tr.referenceRange.min - minVal) / (maxVal - minVal)) * chartH;
                    const refMaxY = chartY + chartH - ((tr.referenceRange.max - minVal) / (maxVal - minVal)) * chartH;
                    doc.save()
                       .rect(chartX, refMaxY, chartW, refMinY - refMaxY)
                       .fill("#D5F5E3").restore();
                }

                // Plot points and line
                const points = allVals.map((v, i) => ({
                    x: chartX + 30 + i * ((chartW - 60) / (allVals.length - 1 || 1)),
                    y: chartY + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH
                }));

                // Draw connecting line
                doc.save().lineWidth(1.5).strokeColor(TEAL);
                points.forEach((p, i) => {
                    if (i === 0) doc.moveTo(p.x, p.y);
                    else         doc.lineTo(p.x, p.y);
                });
                doc.stroke().restore();

                // Draw points
                points.forEach((p, i) => {
                    const isLast   = i === points.length - 1;
                    const dotColor = isLast ? NAVY : TEAL;
                    doc.save().circle(p.x, p.y, isLast ? 5 : 3.5).fill(dotColor).restore();

                    // Value label above point
                    const label = String(allVals[i]);
                    doc.fillColor(isLast ? NAVY : TEAL).fontSize(8).font("Helvetica-Bold")
                       .text(label, p.x - 10, p.y - 14, { lineBreak: false, width: 30, align: "center" });
                });

                // X-axis labels
                const xLabels = tr.previousValues.map((_, i) => `Visit ${i + 1}`);
                xLabels.push("Current");
                points.forEach((p, i) => {
                    doc.fillColor(GRAY).fontSize(7).font("Helvetica")
                       .text(xLabels[i], p.x - 15, chartY + chartH + 4, { lineBreak: false, width: 34, align: "center" });
                });

                cursor += chartH + 22;

                // Legend
                doc.save().rect(chartX, cursor, 12, 10).fill("#D5F5E3").restore();
                doc.fillColor(GRAY).fontSize(8).font("Helvetica")
                   .text("Reference range", chartX + 16, cursor + 1, { lineBreak: false });
                cursor += 18;
            }
        }

        // ════════════════════════════════════════════════════════════════
        // FOOTER
        // ════════════════════════════════════════════════════════════════
        const footerY = doc.page.height - 55;
        hRule(footerY, TEAL, 1);
        fillRect(0, footerY + 1, doc.page.width, 54, NAVY);

        doc.fillColor(WHITE).fontSize(8).font("Helvetica")
           .text(
               "This report is generated electronically and is valid without a signature. For queries contact your lab. Confidential — for patient use only.",
               LEFT, footerY + 12, { width: PAGE_W, align: "center" }
           );
        doc.fillColor(TEAL).fontSize(8).font("Helvetica")
           .text("MediLab Diagnostics  •  www.medilab.in  •  support@medilab.in", LEFT, footerY + 30, {
               width: PAGE_W, align: "center"
           });

        doc.end();
    });
};

// Save PDF to local file system
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