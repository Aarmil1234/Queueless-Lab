const { sendResponse } = require("../../utils/sendResponse");
const {
    addParameterSubCategoryDb,
    getParameterSubCategoriesByParameterIdDb,
    updateParameterSubCategoryDb,
    getSingleParameterSubCategoryByIdDb,
    deleteParameterSubCategoryDb,
    getAllParameterSubCategoriesDb
} = require("../../db/paramterSubCategory/paramterSubCategory");
const ParameterSubCategory = require('../../models/parameterSubCategoryModel');

const sanitizeParameterSubCategory = (payload = {}) => {
    const sanitized = {
        ...(payload.parameterId && { parameterId: payload.parameterId }),
        
        ...(payload.code && {
            code: String(payload.code).trim().toUpperCase()
        }),
        
        ...(payload.name && {
            name: String(payload.name).trim()
        }),
        
        ...(payload.isActive !== undefined && {
            isActive: Boolean(payload.isActive)
        })
    };
    
    // Additional validation
    if (!sanitized.parameterId) {
        throw new Error('parameterId is required');
    }
    if (!sanitized.code) {
        throw new Error('code is required');
    }
    if (!sanitized.name) {
        throw new Error('name is required');
    }
    
    return sanitized;
};

async function addParameterSubCategory(req, res) {
    try {
        const sanitizedData = sanitizeParameterSubCategory(req.body);

        const response = await addParameterSubCategoryDb(sanitizedData);

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
            message: 'Parameter subcategory created successfully',
            data: response.data
        });
    } catch (error) {
        console.error('Error in addParameterSubCategory:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { error: error.message })
        });
    }
}

async function updateParameterSubCategory(req, res) {
    try {
        const { parameterSubCategoryId } = req.params;
        const sanitizedData = sanitizeParameterSubCategory(req.body);
        const response = await updateParameterSubCategoryDb(parameterSubCategoryId, sanitizedData);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

// Get all parameter subcategories for a specific parameter
async function getAllParameterSubCategoriesByParameterId(req, res) {
    try {
        const { parameterId } = req.params;
        const response = await getParameterSubCategoriesByParameterIdDb(parameterId);
        return response.length > 0
            ? sendResponse(req, res, 200, response)
            : sendResponse(req, res, 404, "No parameter subcategories found for this parameter");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function getAllParameterSubCategories(req, res) {
    try {
        const response = await getAllParameterSubCategoriesDb();
        return response.length > 0
            ? sendResponse(req, res, 200, response)
            : sendResponse(req, res, 404, "No parameter subcategories found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

// Get a single parameter subcategory by ID
async function getSingleParameterSubCategory(req, res) {
    try {
        const { parameterSubCategoryId } = req.params;
        const response = await getSingleParameterSubCategoryByIdDb(parameterSubCategoryId);
        return response.length > 0
            ? sendResponse(req, res, 200, response)
            : sendResponse(req, res, 404, "Parameter subcategory not found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function deleteParameterSubCategory(req, res) {
    try {
        const { parameterSubCategoryId } = req.params;
        const response = await deleteParameterSubCategoryDb(parameterSubCategoryId);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

module.exports = {
    addParameterSubCategory,
    updateParameterSubCategory,
    getAllParameterSubCategoriesByParameterId,
    getAllParameterSubCategories,
    getSingleParameterSubCategory,
    deleteParameterSubCategory
}
