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
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => {
            resolve({
                fileName,
                buffer: Buffer.concat(buffers)
            });
        });
        doc.on('error', reject);

        // Title
        doc.fontSize(22).text('Patient Lab Report', { align: 'center' });
        doc.moveDown();

        console.log("=============", report);
        
        // Patient Info
        doc.fontSize(14);
        // doc.text(`Report: ${report || 'N/A'}`);
        doc.text(`Patient Name: ${report.patientName || 'N/A'}`);
        doc.text(`Mobile Number: ${report.mobileNumber || 'N/A'}`);
        doc.text(`Gender: ${report.gender || 'N/A'}`);
        doc.moveDown();

        // ✅ Guard against missing/empty testReport
        const tests = Array.isArray(report.testReport) ? report.testReport : [];

        if (tests.length === 0) {
            doc.fontSize(12).text("No test data available.");
        } else {
            tests.forEach((test, index) => {
                doc.fontSize(16).text(`Test ${index + 1}: ${test.testName || 'Unknown'}`);
                doc.moveDown(0.5);

                const params = Array.isArray(test.testParameters) ? test.testParameters : [];
                if (params.length > 0) {
                    params.forEach((param) => {
                        doc.fontSize(12).text(
                            `${param.parameterName}: ${param.value ?? ''} ${param.unit || ''}`
                        );
                    });
                } else {
                    doc.fontSize(12).text("No parameters recorded.");
                }

                doc.moveDown();
            });
        }

        doc.end();
    });
};

module.exports = {
    generatePatientReportPDF
};