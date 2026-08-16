const mongoose = require('mongoose');

const testParameterSchema = new mongoose.Schema({
    parameterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parameter',
        required: true
    },
    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParameterSubCategory',
        default: null
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    status: {
        type: String,
        enum: ['NORMAL', 'ABNORMAL', 'CRITICAL', 'PENDING'],
        default: 'PENDING'
    },
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

// Indexes for better performance
testParameterSchema.index({ parameterId: 1 });
testParameterSchema.index({ subCategoryId: 1 });
testParameterSchema.index({ status: 1 });

const TestParameter = mongoose.model('TestParameter', testParameterSchema);

module.exports = TestParameter;