const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const laboratoryOwnerSchema = new Schema({
    labName: {
        type: String,
        required: [true, 'Laboratory name is required'],
        trim: true
    },
    ownerName: {
        type: String,
        required: [true, 'Owner name is required'],
        trim: true
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true,
        unique: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    labMobileNumber: {
        type: String,
        required: [true, 'Laboratory mobile number is required'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: false,
        select: false
    },
    token: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Add index for frequently queried fields
laboratoryOwnerSchema.index({ email: 1, mobileNumber: 1 });

// Method to compare password
laboratoryOwnerSchema.methods.comparePassword = async function(candidatePassword) {
    // return await bcrypt.compare(candidatePassword, this.password);
    return true; // Implement actual password comparison
};

const LaboratoryOwner = mongoose.model('LaboratoryOwner', laboratoryOwnerSchema);

module.exports = LaboratoryOwner;
