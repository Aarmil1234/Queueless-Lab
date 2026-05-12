// /models/defaultParameterRangeModel.js
const mongoose = require('mongoose');

const defaultParameterRangeSchema = new mongoose.Schema({

    parameterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parameter',
        required: true
    },

    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LaboratoryOwner',
        required: true,
        index: true
    },

    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParameterSubCategory',
        default: null
    },

    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'BOTH'],
        required: true
    },

    ageFrom: {
        type: Number,
        required: true,
        min: 0
    },

    ageTo: {
        type: Number,
        default: null,
        min: 0
    },

    ageType: {
        type: String,
        enum: ['year', 'month', 'day'],
        default: 'year'
    },

    minValue: {
        type: Number,
        required: true
    },

    maxValue: {
        type: Number,
        required: true
    },

    delete: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


// Basic indexes
defaultParameterRangeSchema.index({ parameterId: 1 });
defaultParameterRangeSchema.index({ subCategoryId: 1 });
defaultParameterRangeSchema.index({ gender: 1 });
defaultParameterRangeSchema.index({ ageFrom: 1, ageTo: 1 });


// Unique range constraint
defaultParameterRangeSchema.index(
    { parameterId: 1, subCategoryId: 1, gender: 1, ageFrom: 1, ageTo: 1 },
    {
        unique: true,
        partialFilterExpression: { delete: false }
    }
);


// Validations
defaultParameterRangeSchema.pre('save', function () {

    if (this.ageTo !== null && this.ageTo <= this.ageFrom) {
        throw new Error('ageTo must be greater than ageFrom');
    }

    if (this.minValue > this.maxValue) {
        throw new Error('minValue cannot be greater than maxValue');
    }

});


const DefaultParameterRange = mongoose.model(
    'DefaultParameterRange',
    defaultParameterRangeSchema
);

module.exports = DefaultParameterRange;