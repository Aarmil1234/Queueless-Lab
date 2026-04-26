const DefaultParameterRange = require('../models/defaultParameterRange');
const Patient = require('../models/patient');
const mongoose = require('mongoose');

/**
 * Validates parameter values against their defined ranges
 * @param {Array} testParameters - Array of test parameters with values
 * @param {String} patientId - Patient ID to get age and gender
 * @returns {Object} - { isValid: boolean, errors: Array, warnings: Array }
 */
async function validateParameterRanges(testParameters, patientId) {
    const errors = [];
    const warnings = [];
    
    try {
        // Get patient details for age and gender
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return {
                isValid: false,
                errors: ['Patient not found'],
                warnings: []
            };
        }

        const patientAge = patient.age;
        const patientGender = patient.gender.toUpperCase();
        const ageType = patient.ageType || 'year';

        // Validate each parameter
        for (const param of testParameters) {
            if (!param.parameterId || param.value === null || param.value === undefined) {
                continue;
            }

            try {
                // Find matching ranges for this parameter
                const ranges = await DefaultParameterRange.find({
                    parameterId: new mongoose.Types.ObjectId(param.parameterId),
                    subCategoryId: param.subCategoryId ? new mongoose.Types.ObjectId(param.subCategoryId) : null,
                    delete: false,
                    $or: [
                        { gender: 'BOTH' },
                        { gender: patientGender }
                    ]
                }).sort({ ageFrom: 1 });

                if (ranges.length === 0) {
                    warnings.push(`No range defined for parameter ${param.parameterId}`);
                    continue;
                }

                // Find the appropriate range based on age
                const matchingRange = ranges.find(range => {
                    const ageFrom = range.ageFrom;
                    const ageTo = range.ageTo;
                    
                    if (ageTo === null) {
                        return patientAge >= ageFrom;
                    }
                    return patientAge >= ageFrom && patientAge <= ageTo;
                });

                if (!matchingRange) {
                    warnings.push(`No age-appropriate range found for parameter ${param.parameterId}`);
                    continue;
                }

                // Validate the value against the range
                const numericValue = parseFloat(param.value);
                if (isNaN(numericValue)) {
                    errors.push(`Parameter ${param.parameterId} value "${param.value}" is not a valid number`);
                    continue;
                }

                if (numericValue < matchingRange.minValue || numericValue > matchingRange.maxValue) {
                    const paramName = await getParameterName(param.parameterId);
                    errors.push(
                        `${paramName}: Value ${numericValue} ${matchingRange.unit || ''} is outside normal range ` +
                        `(${matchingRange.minValue}-${matchingRange.maxValue} ${matchingRange.unit || ''})`
                    );
                }

            } catch (error) {
                console.error(`Error validating parameter ${param.parameterId}:`, error);
                errors.push(`Error validating parameter ${param.parameterId}: ${error.message}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };

    } catch (error) {
        console.error('Error in validateParameterRanges:', error);
        return {
            isValid: false,
            errors: [`Validation error: ${error.message}`],
            warnings: []
        };
    }
}

/**
 * Get parameter name by ID
 */
async function getParameterName(parameterId) {
    try {
        const Parameter = require('../models/parameter');
        const param = await Parameter.findById(parameterId);
        return param ? param.name : parameterId;
    } catch (error) {
        return parameterId;
    }
}

/**
 * Determine parameter status based on range validation
 * @param {Array} testParameters - Array of test parameters
 * @param {String} patientId - Patient ID
 * @returns {Array} - Array of parameters with updated status
 */
async function updateParameterStatus(testParameters, patientId) {
    const updatedParameters = [];
    
    try {
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return testParameters;
        }

        const patientAge = patient.age;
        const patientGender = patient.gender.toUpperCase();
        const ageType = patient.ageType || 'year';

        for (const param of testParameters) {
            if (!param.parameterId || param.value === null || param.value === undefined) {
                updatedParameters.push({
                    ...param,
                    status: 'PENDING'
                });
                continue;
            }

            try {
                // Find matching ranges
                const ranges = await DefaultParameterRange.find({
                    parameterId: new mongoose.Types.ObjectId(param.parameterId),
                    subCategoryId: param.subCategoryId ? new mongoose.Types.ObjectId(param.subCategoryId) : null,
                    delete: false,
                    $or: [
                        { gender: 'BOTH' },
                        { gender: patientGender }
                    ]
                }).sort({ ageFrom: 1 });

                if (ranges.length === 0) {
                    updatedParameters.push({
                        ...param,
                        status: 'PENDING'
                    });
                    continue;
                }

                // Find appropriate range
                const matchingRange = ranges.find(range => {
                    const ageFrom = range.ageFrom;
                    const ageTo = range.ageTo;
                    
                    if (ageTo === null) {
                        return patientAge >= ageFrom;
                    }
                    return patientAge >= ageFrom && patientAge <= ageTo;
                });

                if (!matchingRange) {
                    updatedParameters.push({
                        ...param,
                        status: 'PENDING'
                    });
                    continue;
                }

                // Determine status
                const numericValue = parseFloat(param.value);
                if (isNaN(numericValue)) {
                    updatedParameters.push({
                        ...param,
                        status: 'PENDING'
                    });
                    continue;
                }

                let status = 'NORMAL';
                const minValue = matchingRange.minValue;
                const maxValue = matchingRange.maxValue;
                const margin = (maxValue - minValue) * 0.1; // 10% margin

                if (numericValue < minValue - margin || numericValue > maxValue + margin) {
                    status = 'CRITICAL';
                } else if (numericValue < minValue || numericValue > maxValue) {
                    status = 'ABNORMAL';
                }

                updatedParameters.push({
                    ...param,
                    status
                });

            } catch (error) {
                console.error(`Error updating status for parameter ${param.parameterId}:`, error);
                updatedParameters.push({
                    ...param,
                    status: 'PENDING'
                });
            }
        }

        return updatedParameters;

    } catch (error) {
        console.error('Error in updateParameterStatus:', error);
        return testParameters;
    }
}

module.exports = {
    validateParameterRanges,
    updateParameterStatus
};
