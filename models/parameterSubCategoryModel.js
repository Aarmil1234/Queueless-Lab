// /models/parameterSubCategoryModel.js
const mongoose = require('mongoose');

const parameterSubCategorySchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        default: null,
        trim: true
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

// Add indexes for faster lookups
parameterSubCategorySchema.index({ parameterId: 1 });
parameterSubCategorySchema.index({ isActive: 1 });
parameterSubCategorySchema.index({ delete: 1 });

// Pre-save middleware to validate parameter exists and is active
parameterSubCategorySchema.pre('save', async function() {
    if (this.isNew || this.isModified('parameterId')) {
        const Parameter = mongoose.model('Parameter');
        const parameter = await Parameter.findById(this.parameterId);
        
        if (!parameter) {
            throw new Error('Parameter not found');
        }
        
        if (parameter.delete || !parameter.isActive) {
            throw new Error('Cannot create subcategory for inactive or deleted parameter');
        }
    }
});

const ParameterSubCategory = mongoose.model('ParameterSubCategory', parameterSubCategorySchema);

module.exports = ParameterSubCategory;