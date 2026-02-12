const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testEntrySchema = new Schema({
    testName: {
        type: String,
        required: true
    },
    testResult: {
        type: Map,
        of: Schema.Types.Mixed,   // allows dynamic parameters
        required: true,
        default: {}
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