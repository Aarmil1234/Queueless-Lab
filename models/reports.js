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
    testId: {
        type: Schema.Types.ObjectId,
        ref: 'Test',
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
    }
}, {
    timestamps: true,
    minimize: false
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;