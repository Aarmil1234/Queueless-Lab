const ParameterSubCategory = require('../../models/parameterSubCategoryModel');
const DefaultParameterRange = require('../../models/defaultParameterRange');
const HospitalReferenceRange = require('../../models/hospitalCustomParameterRange');
const { Responses } = require('../../utils/responses');

async function getAllParameterSubCategoriesDb(labId) {
    try {
        const subCategories = await ParameterSubCategory.find({ labId, delete: false })
            .populate('parameterId', 'name category')
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
        .populate('parameterId', 'name category')
        .sort({ createdAt: -1 });

        if (!subCategories || subCategories.length === 0) return [];

        // Map over each subCategory and enrich with defaultRanges + hospitalRanges
        const result = await Promise.all(
            subCategories.map(async (subCategory) => {
                const subCategoryId = subCategory._id;
                const resolvedParameterId = subCategory.parameterId?._id ?? subCategory.parameterId;

                // , hospitalRanges
                const [defaultRanges] = await Promise.all([
                    DefaultParameterRange.find({ subCategoryId, labId, delete: false })
                        .sort({ createdAt: -1 }),
                    HospitalReferenceRange.find({ parameterId: resolvedParameterId, labId, isActive: true, delete: false })
                        .sort({ createdAt: -1 }),
                ]);

                return Object.assign(
                    (typeof subCategory.toObject === 'function') ? subCategory.toObject() : { ...subCategory },
                    { defaultRanges }
                    // , hospitalRanges
                );
            })
        );

        return result;
    } catch (error) {
        console.error("getParameterSubCategoriesByParameterIdDb error:", error);
        return [];
    }
}

// async function getParameterSubCategoriesByParameterIdDb(parameterId, labId) {
//     try {
//         const subCategories = await ParameterSubCategory.find({ 
//             parameterId: parameterId,
//             labId,
//             delete: false 
//         })
//         .populate('parameterId', 'name category')
//         .sort({ createdAt: -1 });
//         if (!subCategories) return [];

//         const defaultRanges = await DefaultParameterRange.find({ subCategoryId: id, labId, delete: false })
//             .sort({ createdAt: -1 });
//             // console.log("defaultRanges", defaultRanges);

//         // Fetch hospital-specific ranges for the same parameter within this lab (active only)
//         const parameterId = subCategory.parameterId && subCategory.parameterId._id ? subCategory.parameterId._id : subCategory.parameterId;
//         const hospitalRanges = await HospitalReferenceRange.find({ parameterId: parameterId, labId, isActive: true, delete: false })
//             .sort({ createdAt: -1 });

//         const result = Object.assign(
//             (typeof subCategory.toObject === 'function') ? subCategory.toObject() : {},
//             { defaultRanges, hospitalRanges }
//         );

//         return [result];
//         // return subCategories;
//     } catch (error) {
//         return [];
//     }
// }

async function getSingleParameterSubCategoryByIdDb(id, labId) {
    try {
        const subCategory = await ParameterSubCategory.findOne({ _id: id, labId })
            .populate('parameterId', 'name category');
        return [subCategory];
    } catch (error) {
        return [];
    }
}

// async function getSingleParameterSubCategoryByIdDb(id, labId) {
//     try {
//         const subCategory = await ParameterSubCategory.findOne({ _id: id, labId })
//             .populate('parameterId', 'name category');

//         if (!subCategory) return [];

//         // Fetch default ranges tied to this subcategory
//         const defaultRanges = await DefaultParameterRange.find({ subCategoryId: id, labId, delete: false })
//             .sort({ createdAt: -1 });
//             // console.log("defaultRanges", defaultRanges);

//         // Fetch hospital-specific ranges for the same parameter within this lab (active only)
//         const parameterId = subCategory.parameterId && subCategory.parameterId._id ? subCategory.parameterId._id : subCategory.parameterId;
//         const hospitalRanges = await HospitalReferenceRange.find({ parameterId: parameterId, labId, isActive: true, delete: false })
//             .sort({ createdAt: -1 });

//         const result = Object.assign(
//             (typeof subCategory.toObject === 'function') ? subCategory.toObject() : {},
//             { defaultRanges, hospitalRanges }
//         );

//         return [result];
//     } catch (error) {
//         return [];
//     }
// }

async function addParameterSubCategoryDb(data) {
    try {
        const parameterSubCategory = new ParameterSubCategory(data);
        await parameterSubCategory.save();
        return Responses.success;
    } catch (error) {
        console.error('addParameterSubCategoryDb error:', error);
        if (error.code === 11000) {
            return {
                ...Responses.alreadyExist,
                clientMessage: { Message: 'A parameter subcategory with this name already exists for the specified parameter' }
            };
        }
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
        
        // Check for duplicate name if name is being updated
        if (data.name && data.name !== existingParameterSubCategory.name) {
            const duplicateCheck = await ParameterSubCategory.findOne({
                parameterId: data.parameterId || existingParameterSubCategory.parameterId,
                labId,
                name: data.name,
                delete: false,
                _id: { $ne: id }
            });

            if (duplicateCheck) {
                return {
                    ...Responses.alreadyExist,
                    clientMessage: { Message: 'A parameter subcategory with this name already exists for the specified parameter' }
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
                clientMessage: { Message: 'A parameter subcategory with this name already exists for the specified parameter' }
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