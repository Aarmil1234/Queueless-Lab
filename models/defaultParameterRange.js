// /models/defaultReferenceRangeModel.js
const mongoose = require('mongoose');

const defaultParameterRange = new mongoose.Schema({
    parameterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parameter',
        required: true
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'BOTH'],
        required: true
    },
    ageFrom: {
        type: Number,  // in years
        required: true,
        min: 0
    },
    ageTo: {
        type: Number,  // in years
        default: null, // null means 18+
        min: 0
    },
    minValue: {
        type: Number,
        required: true
    },
    maxValue: {
        type: Number,
        required: true
    },
    ageType: {
        type: String,
        enum: ['year', 'month', 'day'],
        default: 'year'
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

// Add indexes for faster lookups
defaultParameterRange.index({ parameterId: 1 });
defaultParameterRange.index({ gender: 1 });
defaultParameterRange.index({ ageFrom: 1, ageTo: 1 });

// Add a compound index for unique constraint
defaultParameterRange.index(
    { parameterId: 1, gender: 1, ageFrom: 1, ageTo: 1 },
    { unique: true }
);

defaultParameterRange.pre('save', async function () {
    if (this.ageTo !== null && this.ageTo <= this.ageFrom) {
        throw new Error('ageTo must be greater than ageFrom');
    }
});

const DefaultParameterRange = mongoose.model('DefaultParameterRange', defaultParameterRange);

module.exports = DefaultParameterRange;


// {
//   "parameterId": "HB_ID",
//   "gender": "MALE",
//   "ageFrom": 18,
//   "ageTo": null,
//   "minValue": 13,
//   "maxValue": 17
// }
