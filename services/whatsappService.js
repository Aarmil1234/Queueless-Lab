const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const AIBOTIC_URL = "https://app.aibotick.com/api/v1/whatsapp/";

const sendPatientRegistrationMessage = async (mobileNumber, patientName, labName) => {
    try {
        const phone = mobileNumber && mobileNumber.startsWith("+")
            ? mobileNumber
            : `+${mobileNumber}`;

        const apiToken = process.env.AIBOTICK_API_KEY;
        const phoneNumberId = process.env.PHONE_NUMBER_ID;

        const response = await axios.get(
            "https://app.aibotick.com/api/v1/whatsapp/send/template",
            {
                params: {
                    apiToken,
                    phone_number_id: phoneNumberId,
                    template_id: 356612,
                    phone_number: phone,
                    "templateVariable-name-1": patientName,
                    "templateVariable-name-2": labName || "Queueless"
                }
            }
        );

        return response.data;
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

                    const phone = mobileNumber.startsWith("+")
                        ? mobileNumber
                        : `+${mobileNumber}`;

                    const doctorContactNo = data.doctorContactNo.startsWith("+")
                    ? data.doctorContactNo
                    : `+${data.doctorContactNo}`;

                    const endpoint =
                        `https://app.aibotick.com/api/v1/whatsapp/send/template`
                         +
                        `?apiToken=${encodeURIComponent(process.env.AIBOTICK_API_KEY)}` +
                        `&phone_number_id=${process.env.PHONE_NUMBER_ID}` +
                        `&template_id=394626` +
                        `&phone_number=${encodeURIComponent(phone)}` +
                        `&templateVariable-name-1=${encodeURIComponent(data.patientName)}` +
                        `&template_header_media_url=${encodeURIComponent(data.pdfUrl)}`;

                        const payload = {
                            apiToken: process.env.AIBOTICK_API_KEY,
                            phone_number_id: process.env.PHONE_NUMBER_ID,
                            template_id: 394626,
                            phone_number: phone,
                            "templateVariable-name-1": data.patientName,
                            template_header_media_url: data.pdfUrl
                        };

                    const response = await axios.get(
                        "https://app.aibotick.com/api/v1/whatsapp/send/template",
                        {
                            params: {
                            apiToken: process.env.AIBOTICK_API_KEY,
                            phone_number_id: process.env.PHONE_NUMBER_ID,
                            template_id: 394626,
                            phone_number: doctorContactNo,
                            "templateVariable-name-1": data.patientName,
                            "templateVariable-name-2": data.labName || "Queueless",
                            template_header_media_url: data.pdfUrl
                            }
                        }
                    );

                    const drResponse = await axios.get(
                        "https://app.aibotick.com/api/v1/whatsapp/send/template",
                        {
                            params: {
                            apiToken: process.env.AIBOTICK_API_KEY,
                            phone_number_id: process.env.PHONE_NUMBER_ID,
                            template_id: 356610,
                            phone_number: phone,
                            "templateVariable-name-1": data.doctorName,
                            "templateVariable-name-2": data.patientName,
                            "templateVariable-name-3": data.labName || "Queueless",
                            template_header_media_url: data.pdfUrl
                            }
                        }
                    );
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