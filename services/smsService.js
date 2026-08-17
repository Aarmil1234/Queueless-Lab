const axios = require("axios");

const SHREESMS_URL = "https://web.shreesms.net/API/SendSMS.aspx";

const buildOtpMessage = (otp) =>
    `Your OTP for password reset is ${otp}. Valid for 10 minutes. - QUELES`;

const sendOtpSms = async (mobileNumber, otp) => {
    try {
        const mobile = mobileNumber.replace(/\D/g, "").slice(-10);

        const response = await axios.get(SHREESMS_URL, {
            params: {
                APIkey: process.env.SHREESMS_API_KEY,
                SenderID: process.env.SHREESMS_SENDER_ID,
                SMSType: 4, // OTP Transactional
                Mobile: mobile,
                MsgText: buildOtpMessage(otp),
                EntityID: process.env.SHREESMS_ENTITY_ID,
                TemplateID: process.env.SHREESMS_TEMPLATE_ID
            }
        });

        return response.data;
    } catch (error) {
        console.error(
            "ShreeSMS OTP send error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

module.exports = { sendOtpSms };
