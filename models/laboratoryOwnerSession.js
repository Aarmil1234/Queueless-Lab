const mongoose = require('mongoose');

const laboratoryOwnerSessionSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LaboratoryOwner',
            required: true,
            index: true
        },

        token: {
            type: String,
            required: true
        },

        deviceInfo: {
            type: String,
            default: ''
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    'LaboratoryOwnerSession',
    laboratoryOwnerSessionSchema
);