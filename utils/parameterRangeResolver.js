const mongoose = require('mongoose');
const DefaultParameterRange = require('../models/defaultParameterRange');
const Parameter = require('../models/parameter');

/**
 * Resolves the applicable reference range for each test parameter based on the
 * patient's age and gender. Uses the same matching rules as
 * parameterRangeValidator.js: filter DefaultParameterRange by parameterId +
 * subCategoryId + gender (BOTH or the patient's gender), then pick the row whose
 * age bracket [ageFrom, ageTo] contains the patient's age (ageTo === null means
 * open-ended).
 *
 * @param {Array} testParameters - [{ parameterId, subCategoryId, parameterName? }]
 * @param {Object} patient - { age, gender }
 * @returns {Promise<Array>} [{ parameterId, parameterName, subCategoryId,
 *                              referenceRange: { min, max, text } | null }]
 */
async function resolveParameterRanges(testParameters = [], patient = {}) {
    if (!Array.isArray(testParameters) || testParameters.length === 0) {
        return [];
    }

    const patientAge = typeof patient.age === 'number' ? patient.age : parseFloat(patient.age);
    const patientGender = (patient.gender || '').toString().toUpperCase();

    const resolved = [];

    for (const param of testParameters) {
        const parameterId = param && param.parameterId;
        if (!parameterId || !mongoose.Types.ObjectId.isValid(parameterId)) {
            continue;
        }

        const subCategoryId = param.subCategoryId && mongoose.Types.ObjectId.isValid(param.subCategoryId)
            ? new mongoose.Types.ObjectId(param.subCategoryId)
            : null;

        let referenceRange = null;

        try {
            const ranges = await DefaultParameterRange.find({
                parameterId: new mongoose.Types.ObjectId(parameterId),
                subCategoryId,
                delete: false,
                $or: [
                    { gender: 'BOTH' },
                    ...(patientGender ? [{ gender: patientGender }] : [])
                ]
            }).sort({ ageFrom: 1 });

            const matchingRange = ranges.find(range => {
                if (Number.isNaN(patientAge)) {
                    return false;
                }
                if (range.ageTo === null || range.ageTo === undefined) {
                    return patientAge >= range.ageFrom;
                }
                return patientAge >= range.ageFrom && patientAge <= range.ageTo;
            });

            if (matchingRange) {
                referenceRange = {
                    min: matchingRange.minValue,
                    max: matchingRange.maxValue,
                    text: `${matchingRange.minValue} - ${matchingRange.maxValue}`
                };
            }
        } catch (error) {
            console.error(`Error resolving range for parameter ${parameterId}:`, error.message);
        }

        let parameterName = param.parameterName || param.name || null;
        if (!parameterName) {
            try {
                const parameterDoc = await Parameter.findById(parameterId).select('name').lean();
                parameterName = parameterDoc ? parameterDoc.name : null;
            } catch (error) {
                parameterName = null;
            }
        }

        resolved.push({
            parameterId: parameterId.toString(),
            parameterName,
            subCategoryId: subCategoryId ? subCategoryId.toString() : null,
            referenceRange
        });
    }

    return resolved;
}

module.exports = {
    resolveParameterRanges
};
