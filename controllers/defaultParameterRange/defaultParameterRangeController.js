const { sendResponse } = require("../../utils/sendResponse");
const {
    addDefaultParameterRangeDb,
    getDefaultParameterRangeByParameterIdDb,
    updateDefaultParameterRangeDb,
    getSingleParameterRangeByIdDb,
    deleteDefaultParameterRangeDb
} = require("../../db/defaultParameterRange/defaultParameterRange");

const sanitizeDefaultParameterRange = (payload = {}) => {
    const sanitized = {
        ...(payload.parameterId && { parameterId: payload.parameterId }),
        ...(payload.gender && {
            gender: String(payload.gender).toUpperCase()
        }),
        ...(payload.ageFrom !== undefined && {
            ageFrom: Number(payload.ageFrom)
        }),
        ...(payload.ageTo !== undefined && {
            ageTo: payload.ageTo === null ? null : Number(payload.ageTo)
        }),
        ...(payload.minValue !== undefined && {
            minValue: Number(payload.minValue)
        }),
        ...(payload.maxValue !== undefined && {
            maxValue: Number(payload.maxValue)
        }),
        ...(payload.ageType !== undefined && {
            ageType: String(payload.ageType)
        }),
        ...(payload.isActive !== undefined && {
            isActive: Boolean(payload.isActive)
        })
    };
    // Additional validation
    if (sanitized.ageTo !== null && sanitized.ageFrom > sanitized.ageTo) {
        throw new Error('ageTo must be greater than ageFrom');
    }
    if (sanitized.minValue > sanitized.maxValue) {
        throw new Error('maxValue must be greater than minValue');
    }
    if (!['MALE', 'FEMALE', 'BOTH'].includes(sanitized.gender)) {
        throw new Error('gender must be one of: MALE, FEMALE, BOTH');
    }
    return sanitized;
};

async function addDefaultParameterRange(req, res) {
    try {
        const sanitizedData = sanitizeDefaultParameterRange(req.body);
        const response = await addDefaultParameterRangeDb(sanitizedData);

        // If the response has a statusCode, it's an error response
        if (response.statusCode && response.statusCode >= 400) {
            return sendResponse(req, res, response.statusCode, {
                success: false,
                message: response.message || 'An error occurred',
                ...(response.error && { error: response.error })
            });
        }

        return sendResponse(req, res, response.statusCode || 201, {
            success: true,
            message: 'Parameter range created successfully',
            data: response.data
        });
    } catch (error) {
        console.error('Error in addDefaultParameterRange:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
}

async function updateDefaultParameterRange(req, res) {
    try {
        const { parameterRangeId } = req.params;
        const sanitizedData = sanitizeDefaultParameterRange(req.body);
        const response = await updateDefaultParameterRangeDb(parameterRangeId, sanitizedData);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

// Get all parameter ranges for a specific parameter
async function getAllParameterRangesByParameterId(req, res) {
    try {
        const { parameterId } = req.params;
        const response = await getDefaultParameterRangeByParameterIdDb(parameterId);
        return response.length > 0
            ? sendResponse(req, res, 200, response)
            : sendResponse(req, res, 404, "No parameter ranges found for this parameter");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function getAllParameterRanges(req, res) {
    try {
        const { parameterId } = req.params;
        const response = await getAllParameterRangesDb(parameterId);
        return response.length > 0
            ? sendResponse(req, res, 200, response)
            : sendResponse(req, res, 404, "No parameter ranges found for this parameter");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

// Get a single parameter range by ID
async function getSingleParameterRange(req, res) {
    try {
        const { parameterRangeId } = req.params;
        const response = await getSingleParameterRangeByIdDb(parameterRangeId);
        return response.length > 0
            ? sendResponse(req, res, 200, response)
            : sendResponse(req, res, 404, "Parameter range not found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function deleteParameterRange(req, res) {
    try {
        const { parameterRangeId } = req.params;
        const response = await deleteDefaultParameterRangeDb(parameterRangeId);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

module.exports = {
    addDefaultParameterRange,
    updateDefaultParameterRange,
    getAllParameterRangesByParameterId,
    getSingleParameterRange,
    deleteParameterRange
}
