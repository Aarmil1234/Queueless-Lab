const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testParameterSchema = new Schema({
    parameterId: {
        type: Schema.Types.ObjectId,
        ref: 'Parameter',
        required: true
    },
    subCategoryId: {
        type: Schema.Types.ObjectId,
        ref: 'ParameterSubCategory',
        default: null
    },
    value: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    status: {
        type: String,
        enum: ['NORMAL', 'ABNORMAL', 'CRITICAL', 'PENDING'],
        default: 'PENDING'
    },
    // Snapshot of the sub-parameter's unit at submission time
    unit: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const testEntrySchema = new Schema({
    testName: {
        type: String,
        required: true
    },
    testReportId: {
        type: Schema.Types.ObjectId,
        ref: 'TestReport',
        default: null
    },
    isReportSubmitted: { type : Boolean, required: true, default : false},
    // Keep backward compatibility
    testResult: {
        type: Map,
        of: Schema.Types.Mixed,
        required: true,
        default: {}
    },
    // New dynamic parameter structure
    testParameters: {
        type: [testParameterSchema],
        default: []
    }
}, {
    timestamps: true
});

const reportSchema = new Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    labId: {
        type: String,
        required: true,
        index: true
    },
    testReport: {
        type: [testEntrySchema],
        default: []
    },
    pdfUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    minimize: false
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;