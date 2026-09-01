const TestReport = require('../../models/testReport');
const Parameter = require('../../models/parameter');
const ParameterSubCategory = require('../../models/parameterSubCategoryModel');
const { Responses } = require('../../utils/responses');

async function getAllTestReportsDb(labId) {
    try {
        const testReport = await TestReport.find({ labId, delete: false }).sort({ createdAt: -1 });
        return testReport;
    } catch (error) {
        return [];
    }
}

async function getTestReportByIdDb(id, labId) {
    try {
        const testReport = await TestReport.findOne({ _id: id, labId });
        return [testReport];
    } catch (error) {
        return [];
    }
}

async function getTestReportParametersWithSubCategoriesDb(testReportId, labId) {
    try {
        const testReport = await TestReport.findOne({
            _id: testReportId,
            labId,
            delete: false,
            isActive: true
        }).lean();

        if (!testReport) {
            return {
                success: false,
                message: 'Test report not found'
            };
        }

        const parameters = await Parameter.find({
            testReportId,
            labId,
            delete: false,
            isActive: true
        })
        .select('name category type')
        .lean();

        // Get subcategories for each parameter
        const parametersWithSubCategories = await Promise.all(
            parameters.map(async (parameter) => {
                const subCategories = await ParameterSubCategory.find({
                    parameterId: parameter._id,
                    delete: false,
                    isActive: true
                })
                .select('name unit')
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
                ...testReport,
                parameters: parametersWithSubCategories
            }
        };
    } catch (error) {
        console.error('Error in getTestReportParametersWithSubCategoriesDb:', error);
        return {
            ...Responses.tryAgain,
            error: error.message
        };
    }
}

async function addTestReportDb(data) {
    try {
        //check if test report with same code already exists
        const existingTestReport = await TestReport.findOne({
            code: { $regex: new RegExp(`^${data.code}$`, 'i') },
            labId: data.labId,
            delete: false
        });

        if (existingTestReport) {
            return Responses.alreadyExist;
        }
        const testReport = new TestReport(data);

        await testReport.save();
        return Responses.success;
    } catch (error) {
        return Responses.tryAgain;
    }
}

async function updateTestReportDb(id, data, labId) {
    try {
        //check if parameter exists
        const existingTestReport = await TestReport.findOne({ _id: id, labId });
        if (!existingTestReport) {
            return Responses.notFound;
        }
        // If code is being updated, check for duplicates
        if (data.code && data.code !== existingTestReport.code) {
            const codeExists = await TestReport.findOne({
                code: data.code,
                labId,
                _id: { $ne: id },
                delete: { $ne: true }
            });
            if (codeExists) {
                return {
                    ...Responses.alreadyExist,
                    clientMessage: { Message: 'Another test report with this code already exists' }
                };
            }
        }
        const updatedTestReport = await TestReport.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).lean();
        return Responses.success;
    } catch (error) {
        return Responses.tryAgain;
    }
}

async function deleteTestReportDb(id, labId) {
    try {
        const deletedTestReport = await TestReport.findOneAndUpdate(
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
    getAllTestReportsDb,
    getTestReportByIdDb,
    getTestReportParametersWithSubCategoriesDb,
    addTestReportDb,
    updateTestReportDb,
    deleteTestReportDb
}