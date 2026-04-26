const { Responses } = require("../../utils/responses");
const Test = require("../../models/test");
const Parameter = require("../../models/parameter");
const ParameterSubCategory = require("../../models/parameterSubCategoryModel");

const createTestDb = async (testData) => {
    try {
        const { testName, testCode, category, parameters } = testData;

        // Validate parameters exist
        if (parameters && parameters.length > 0) {
            const existingParameters = await Parameter.find({
                _id: { $in: parameters },
                delete: false,
                isActive: true
            });

            if (existingParameters.length !== parameters.length) {
                return {
                    success: false,
                    message: 'One or more parameters are invalid or inactive'
                };
            }
        }

        const test = new Test({
            testName,
            testCode,
            category,
            parameters: parameters || []
        });

        await test.save();

        return {
            ...Responses.created,
            data: test
        };
    } catch (error) {
        console.error('Error in createTestDb:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
};

const getAllTestsDb = async () => {
    try {
        const tests = await Test.find({
            delete: false,
            isActive: true
        })
        .populate('parameters', 'code name category type unit')
        .lean();

        return {
            ...Responses.success,
            data: tests
        };
    } catch (error) {
        console.error('Error in getAllTestsDb:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
};

const getTestByIdDb = async (testId) => {
    try {
        const test = await Test.findOne({
            _id: testId,
            delete: false,
            isActive: true
        })
        .populate('parameters', 'code name category type unit')
        .lean();

        if (!test) {
            return {
                success: false,
                message: 'Test not found'
            };
        }

        return {
            ...Responses.success,
            data: test
        };
    } catch (error) {
        console.error('Error in getTestByIdDb:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
};

const getTestParametersWithSubCategoriesDb = async (testId) => {
    try {
        const test = await Test.findOne({
            _id: testId,
            delete: false,
            isActive: true
        })
        .populate({
            path: 'parameters',
            match: { delete: false, isActive: true },
            select: 'code name category type unit'
        })
        .lean();

        if (!test) {
            return {
                success: false,
                message: 'Test not found'
            };
        }

        // Get subcategories for each parameter
        const parametersWithSubCategories = await Promise.all(
            test.parameters.map(async (parameter) => {
                const subCategories = await ParameterSubCategory.find({
                    parameterId: parameter._id,
                    delete: false,
                    isActive: true
                })
                .select('code name')
                .lean();

                return {
                    ...parameter,
                    subCategories
                };
            })
        );

        return {
            ...Responses.success,
            data: {
                ...test,
                parameters: parametersWithSubCategories
            }
        };
    } catch (error) {
        console.error('Error in getTestParametersWithSubCategoriesDb:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
};

module.exports = {
    createTestDb,
    getAllTestsDb,
    getTestByIdDb,
    getTestParametersWithSubCategoriesDb
};
