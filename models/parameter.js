// /models/parameterModel.js
const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
    testReportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestReport',
        required: true,
        index: true
    },
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LaboratoryOwner',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['NUMERIC', 'POS_NEG', 'TEXT'],
        required: true
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

parameterSchema.index({ category: 1 });
parameterSchema.index({ isActive: 1 });

// Validate parent TestReport exists and is active before saving a Parameter under it
parameterSchema.pre('save', async function () {
    if (this.isNew || this.isModified('testReportId')) {
        const TestReport = mongoose.model('TestReport');
        const testReport = await TestReport.findById(this.testReportId);

        if (!testReport) {
            throw new Error('TestReport not found');
        }

        if (testReport.delete || !testReport.isActive) {
            throw new Error('Cannot create parameter for inactive or deleted test report');
        }
    }
});

const Parameter = mongoose.model('Parameter', parameterSchema);

module.exports = Parameter;

// {
//   "testReportId": "5f8d0d55b54764421b6b0b1a",
//   "name": "Hemoglobin",
//   "category": "CBC",
//   "type": "NUMERIC",
//   "isActive": true
// }
