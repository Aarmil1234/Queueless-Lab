const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const ENGAGIFY_MESSAGES_URL = "https://app.engagify.co.in/api/v1/messages";
const DEFAULT_COUNTRY_CODE = "+91";
const TEMPLATE_LANGUAGE = "en_US";

// Splits a stored number ("919876543210", "+91 98765 43210", "9876543210")
// into the { countryCode, phoneNumber } shape Engagify expects.
const splitPhoneNumber = (mobileNumber) => {
    const digits = String(mobileNumber || "").replace(/\D/g, "");

    if (!digits) {
        throw new Error("Mobile number is required");
    }

    if (digits.length <= 10) {
        return { countryCode: DEFAULT_COUNTRY_CODE, phoneNumber: digits };
    }

    return {
        countryCode: `+${digits.slice(0, digits.length - 10)}`,
        phoneNumber: digits.slice(-10)
    };
};

// Sends one APPROVED template to one recipient.
// bodyVariables is an ordered array mapped to {{1}}, {{2}}...
// documentUrl fills a DOCUMENT header (required by reports_new / doc_report).
const sendTemplateMessage = async ({ mobileNumber, name, templateName, bodyVariables = [], documentUrl, documentName }) => {
    const variables = {};

    if (bodyVariables.length) {
        variables.body = bodyVariables.map((value) => ({
            source: "STATIC",
            value: String(value ?? "")
        }));
    }

    if (documentUrl) {
        variables.headerMedia = {
            type: "DOCUMENT",
            link: documentUrl,
            filename: documentName || "Report.pdf"
        };
    }

    const payload = {
        to: { ...splitPhoneNumber(mobileNumber), ...(name && { name }) },
        templateName,
        language: TEMPLATE_LANGUAGE,
        ...(Object.keys(variables).length && { variables })
    };

    const response = await axios.post(ENGAGIFY_MESSAGES_URL, payload, {
        headers: {
            Authorization: `Bearer ${process.env.ENGAGIFY_API_KEY}`,
            "Content-Type": "application/json"
        }
    });

    if (response.data?.errorCode || response.data?.status === "FAILED") {
        throw new Error(
            `Engagify ${templateName} failed: ${response.data.errorMessage || response.data.errorCode}`
        );
    }

    return response.data;
};

const sendPatientRegistrationMessage = async (mobileNumber, patientName, labName) => {
    try {
        return await sendTemplateMessage({
            mobileNumber,
            name: patientName,
            templateName: "lab_reports",
            bodyVariables: [
                patientName,
                labName || "Queueless",
                labName || "Queueless"
            ]
        });
    } catch (error) {
        console.error(
            "WhatsApp registration message error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

const sendWhatsAppMessages = async (type, numbers, data) => {
    try {
        switch (type) {

            case "labReport":

                for (const mobileNumber of numbers) {

                    // This is to send message to patient
                    await sendTemplateMessage({
                        mobileNumber,
                        name: data.patientName,
                        templateName: "reports_new",
                        bodyVariables: [
                            data.patientName,
                            data.labName || "Queueless"
                        ],
                        documentUrl: data.pdfUrl
                    });

                    await sendTemplateMessage({
                        mobileNumber: data.doctorContactNo,
                        name: data.doctorName,
                        templateName: "doc_report",
                        bodyVariables: [
                            data.doctorName,
                            data.patientName,
                            data.labName || "Queueless"
                        ],
                        documentUrl: data.pdfUrl
                    });
                }

                break;

            default:
                throw new Error(`Unsupported template type: ${type}`);
        }

    } catch (error) {
        console.error(
            "WhatsApp API Error:",
            error.response?.data || error.message
        );
        throw error;
    }
}

module.exports = {
    sendWhatsAppMessages,
    sendPatientRegistrationMessage
};
