const assert = require('assert');
const { saveReportPdfMetadataDb } = require('../db/report/report');
const Report = require('../models/reports');

(async () => {
    const originalFindByIdAndUpdate = Report.findByIdAndUpdate;
    const calls = [];

    Report.findByIdAndUpdate = async (id, update, options) => {
        calls.push({ id, update, options });
        return {
            _id: id,
            labId: 'lab-123',
            ...update.$set
        };
    };

    try {
        const result = await saveReportPdfMetadataDb('report-123', 'lab-123', {
            pdfUrl: 'https://example.com/report.pdf'
        });

        assert.strictEqual(result.success, true, 'Expected save to succeed');
        assert.strictEqual(calls.length, 1, 'Expected one database update');
        assert.strictEqual(calls[0].update.$set.pdfUrl, 'https://example.com/report.pdf');
        console.log('report-pdf-storage test passed');
    } finally {
        Report.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
})();
