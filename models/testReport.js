// /models/testReportModel.js
const mongoose = require('mongoose');

const testReportSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: false,
        trim: true,
        uppercase: true
    },
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LaboratoryOwner',
        required: true,
        index: true
    },
    testName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    delete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

testReportSchema.index({ category: 1 });
testReportSchema.index({ isActive: 1 });

// Unique code per lab (ignoring soft-deleted rows)
testReportSchema.index(
    { labId: 1, code: 1 },
    {
        unique: true,
        partialFilterExpression: { delete: false }
    }
);

const TestReport = mongoose.model('TestReport', testReportSchema);

module.exports = TestReport;

// {
//   "code": "CBC",
//   "testName": "Complete Blood Count",
//   "category": "Blood Test"
// }
