const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reportSchema = new Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    testReport: {
        type: Map,
        of: Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    minimize: false  // Ensures empty objects are stored
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;