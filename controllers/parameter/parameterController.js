const { sendResponse } = require("../../utils/sendResponse");
const {
    addParameterDb,
    updateParameterDb,
    getAllParametersDb,
    getParametersByTestReportIdDb,
    getParameterByIdDb,
    deleteParameterDb
} = require("../../db/parameter/parameter");

const sanitizeParameterPayload = (payload = {}) => ({
    ...(payload.testReportId && { testReportId: payload.testReportId }),
    ...(payload.code && { code: payload.code.trim().toUpperCase() }),
    ...(payload.name && { name: payload.name.trim() }),
    ...(payload.category && { category: payload.category.trim() }),
    ...(payload.type && { type: payload.type.toUpperCase() }),
    ...(payload.unit !== undefined && {
        unit: payload.unit ? payload.unit.trim() : null
    }),
    ...(payload.isActive !== undefined && { isActive: payload.isActive })
});

async function addParameter(req, res) {
    try {
        const parameterData = sanitizeParameterPayload(req.body);
        parameterData.labId = req.labId;
        const response =  await addParameterDb(parameterData);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        // logger.error(`Error in addParameter: ${error.message}`);
        
        return sendResponse(req, res, 500, error.message);
    }
};

/**
 * UPDATE PARAMETER
 */
async function updateParameter(req, res) {
    try {
        const { id } = req.params;
        const updateData = sanitizeParameterPayload(req.body);
        const response = await updateParameterDb(id, updateData, req.labId);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
};

async function getAllParameters(req, res) {
    try {
        const response = await getAllParametersDb(req.labId);
        if(response.length > 0){
            return sendResponse(req, res, 200, response);
        }
        return sendResponse(req, res, 404, "No parameters found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function getParameterById(req, res) {
    try {
        const { id } = req.params;
        const response = await getParameterByIdDb(id, req.labId);
        if(response.length > 0){
            return sendResponse(req, res, 200, response);
        }
        return sendResponse(req, res, 404, "Parameter not found");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function getParametersByTestReportId(req, res) {
    try {
        const { testReportId } = req.params;
        const response = await getParametersByTestReportIdDb(testReportId, req.labId);
        if(response.length > 0){
            return sendResponse(req, res, 200, response);
        }
        return sendResponse(req, res, 404, "No parameters found for this test report");
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

async function deleteParameter(req, res) {
    try {
        const { id } = req.params;
        const response = await deleteParameterDb(id, req.labId);
        return sendResponse(req, res, response.statusCode, response.clientMessage);
    } catch (error) {
        return sendResponse(req, res, 500, error.message);
    }
}

module.exports = {
    addParameter,
    updateParameter,
    getAllParameters,
    getParameterById,
    getParametersByTestReportId,
    deleteParameter
};
