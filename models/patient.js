const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
    caseId: {
        type: String,
        required: [true, 'Case ID is required'],
        trim: true
    },
    patientName: {
        type: String,
        required: [true, 'Patient name is required'],
        trim: true
    },
    gender: {
        type: String,
        required: [true, 'Gender is required'],
        enum: ['Male', 'Female', 'Other']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [0, 'Age cannot be negative']
    },
    ageType: {
        type: String,
        enum: ['month', 'year'],
        default: 'year'
    },
    referredByDoctor: {
        type: String,
        required: [true, 'Referred by doctor is required'],
        trim: true
    },
    doctorContactNo: {
        type: String,
        required: [true, 'Doctor contact number is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    tests: {
        type: Array,
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt timestamps
});


const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;