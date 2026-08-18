const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpVerificationSchema = new Schema({
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        unique: true,
        index: true
    },
    otp: {
        type: String,
        required: [true, 'OTP is required']
    },
    expiresAt: {
        type: Number,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Number,
        default: Date.now
    }
}, {
    timestamps: true,
});

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

module.exports = OtpVerification;
