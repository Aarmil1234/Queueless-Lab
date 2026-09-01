const Parameter = require('../../models/parameter');
const { Responses } = require('../../utils/responses');

async function getAllParametersDb(labId) {
    try {
        const parameters = await Parameter.find({ labId, delete: false })
            .populate('testReportId', 'code testName category')
            .sort({ createdAt: -1 });
        return parameters;
    } catch (error) {
        return [];
    }
}

async function getParametersByTestReportIdDb(testReportId, labId) {
    try {
        const parameters = await Parameter.find({ testReportId, labId, delete: false })
            .populate('testReportId', 'code testName category')
            .sort({ createdAt: -1 });
        return parameters;
    } catch (error) {
        return [];
    }
}

async function getParameterByIdDb(id, labId) {
    try {
        const parameter = await Parameter.findOne({ _id: id, labId })
            .populate('testReportId', 'code testName category');
        return parameter ? [parameter] : [];
    } catch (error) {
        return [];
    }
}

async function addParameterDb(data) {
    try {
        //check if parameter with same name already exists under the same test report
        const existingParameter = await Parameter.findOne({
            testReportId: data.testReportId,
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            labId: data.labId,
            delete: false
        });

        if (existingParameter) {
            return Responses.alreadyExist;
        }
        const parameter = new Parameter(data);

        await parameter.save();
        return Responses.success;
    } catch (error) {
        return { ...Responses.tryAgain, error: error.message };
    }
}

async function updateParameterDb(id, data, labId) {
    try {
        //check if parameter exists
        const existingParameter = await Parameter.findOne({ _id: id, labId });
        if (!existingParameter) {
            return Responses.notFound;
        }
        // If name is being updated, check for duplicates within the same test report
        if (data.name && data.name !== existingParameter.name) {
            const nameExists = await Parameter.findOne({
                testReportId: data.testReportId || existingParameter.testReportId,
                name: data.name,
                labId,
                _id: { $ne: id },
                delete: { $ne: true }
            });
            if (nameExists) {
                return {
                    ...Responses.alreadyExist,
                    clientMessage: { Message: 'A parameter with this name already exists for the specified test report' }
                };
            }
        }
        const updatedParameter = await Parameter.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).lean();
        return Responses.success;
    } catch (error) {
        return { ...Responses.tryAgain, error: error.message };
    }
}

async function deleteParameterDb(id, labId) {
    try {
        const deletedParameter = await Parameter.findOneAndUpdate(
            { _id: id, labId },
            {
                delete: true,
                updatedAt: new Date()
            }, { new: true }).lean();
        return Responses.success;
    } catch (error) {
        return Responses.tryAgain;
    }
}

module.exports = {
    getAllParametersDb,
    getParametersByTestReportIdDb,
    getParameterByIdDb,
    addParameterDb,
    updateParameterDb,
    deleteParameterDb
};
