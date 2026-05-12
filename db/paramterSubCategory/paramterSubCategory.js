const ParameterSubCategory = require('../../models/parameterSubCategoryModel');
const { Responses } = require('../../utils/responses');

async function getAllParameterSubCategoriesDb(labId) {
    try {
        const subCategories = await ParameterSubCategory.find({ labId, delete: false })
            .populate('parameterId', 'code name category')
            .sort({ createdAt: -1 });
        return subCategories;
    } catch (error) {
        return [];
    }
}

async function getParameterSubCategoriesByParameterIdDb(parameterId, labId) {
    try {
        const subCategories = await ParameterSubCategory.find({ 
            parameterId: parameterId,
            labId,
            delete: false 
        })
        .populate('parameterId', 'code name category')
        .sort({ createdAt: -1 });
        return subCategories;
    } catch (error) {
        return [];
    }
}

async function getSingleParameterSubCategoryByIdDb(id, labId) {
    try {
        const subCategory = await ParameterSubCategory.findOne({ _id: id, labId })
            .populate('parameterId', 'code name category');
        return [subCategory];
    } catch (error) {
        return [];
    }
}

async function addParameterSubCategoryDb(data) {
    try {
        const parameterSubCategory = new ParameterSubCategory(data);
        await parameterSubCategory.save();
        return Responses.success;
    } catch (error) {
        return Responses.tryAgain;
    }
}

async function updateParameterSubCategoryDb(id, data, labId) {
    try {
        //check if parameter subcategory exists
        const existingParameterSubCategory = await ParameterSubCategory.findOne({ _id: id, labId });
        if (!existingParameterSubCategory) {
            return Responses.notFound;
        }
        
        // Check for duplicate code if code is being updated
        if (data.code && data.code !== existingParameterSubCategory.code) {
            console.log('Checking for duplicate:', {
                newCode: data.code,
                oldCode: existingParameterSubCategory.code,
                parameterId: data.parameterId || existingParameterSubCategory.parameterId,
                currentId: id
            });
            
            const duplicateCheck = await ParameterSubCategory.findOne({
                parameterId: data.parameterId || existingParameterSubCategory.parameterId,
                labId,
                code: data.code,
                delete: false,
                _id: { $ne: id }
            });
            
            console.log('Duplicate check result:', duplicateCheck);
            
            if (duplicateCheck) {
                return {
                    ...Responses.alreadyExist,
                    clientMessage: { Message: 'A parameter subcategory with this code already exists for the specified parameter' }
                };
            }
        }
        
        const updatedParameterSubCategory = await ParameterSubCategory.findByIdAndUpdate(
            id,
            {
                ...data,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).lean();
        
        console.log('Update successful:', updatedParameterSubCategory);
        return Responses.success;
    } catch (error) {
        console.log('Update error:', error);
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return {
                ...Responses.alreadyExist,
                clientMessage: { Message: 'A parameter subcategory with this code already exists for the specified parameter' }
            };
        }
        return Responses.tryAgain;
    }
}

async function deleteParameterSubCategoryDb(id, labId) {
    try {
        const deletedParameterSubCategory = await ParameterSubCategory.findOneAndUpdate(
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
    getAllParameterSubCategoriesDb,
    getParameterSubCategoriesByParameterIdDb,
    getSingleParameterSubCategoryByIdDb,
    addParameterSubCategoryDb,
    updateParameterSubCategoryDb,
    deleteParameterSubCategoryDb,
}