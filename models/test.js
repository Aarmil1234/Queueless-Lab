const mongoose = require('mongoose');
const TestParameter = require('./testParameter');

const testSchema = new mongoose.Schema({
    testName: {
        type: String,
        required: true
    },
    testCode: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    parameters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parameter'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    delete: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
// testCode index is already defined with unique: true in schema
testSchema.index({ category: 1 });
testSchema.index({ isActive: 1 });
testSchema.index({ delete: 1 });

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
