
const { sendResponse } = require("../../utils/sendResponse");

//create login with email and password and jwt token
const getAllTestList = async (req, res) => {
    try {
        const info = [
            {
                key: "blood_group",
                name: "Blood Group",
                category: "Blood Test",
                isActive: true
            },
            {
                key: "mp",
                name: "MP",
                category: "Rapid Test",
                isActive: true
            },
            {
                key: "esr",
                name: "ESR",
                category: "Blood Test",
                isActive: true
            },
            {
                key: "cbc",
                name: "CBC",
                category: "Blood Test",
                isActive: true
            },
            {
                key: "urea",
                name: "Urea",
                category: "Biochemistry",
                isActive: true
            },
            {
                key: "creatinine",
                name: "Creatinine",
                category: "Biochemistry",
                isActive: true
            },
            {
                key: "uric_acid",
                name: "Uric Acid",
                category: "Biochemistry",
                isActive: true
            },
            {
                key: "bilirubin",
                name: "Bilirubin",
                category: "Liver Function Test",
                isActive: true
            },
            {
                key: "sgpt",
                name: "SGPT",
                category: "Liver Function Test",
                isActive: true
            },
            {
                key: "sgot",
                name: "SGOT",
                category: "Liver Function Test",
                isActive: true
            },
            {
                key: "alkaline_phosphatase",
                name: "Alkaline Phosphatase",
                category: "Liver Function Test",
                isActive: true
            },
            {
                key: "protein",
                name: "Protein",
                category: "Biochemistry",
                isActive: true
            },
            {
                key: "amylase",
                name: "Amylase",
                category: "Enzyme Test",
                isActive: true
            },
            {
                key: "lipase",
                name: "Lipase",
                category: "Enzyme Test",
                isActive: true
            },
            {
                key: "gamma_gt",
                name: "Gamma GT",
                category: "Liver Function Test",
                isActive: true
            },
            {
                key: "vdrl",
                name: "VDRL",
                category: "Serology",
                isActive: true
            }
        ];
        return sendResponse(req, res, 200, { Data: info });
    } catch (e) {
        console.error(e);
        return sendResponse(req, res, 500, { Message: e.message });
    }
};

module.exports = {
    getAllTestList
};
