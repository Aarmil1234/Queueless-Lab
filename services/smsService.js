const axios = require("axios");
const OtpVerification = require("../models/otpVerification");

const SHREESMS_URL = "https://web.shreesms.net/API/SendSMS.aspx";
const otpExpiryMinutes = 10;

// Generate a random numeric OTP
function generateOTP(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
}

const buildOtpMessage = (otp) =>
    `Your OTP for password reset is ${otp}. Valid for 10 minutes. - QUELES`;

const sendOtpSms = async (mobileNumber) => {
    const otp = generateOTP();
    try {
        const missing = [
            !process.env.SHREESMS_API_KEY && "SHREESMS_API_KEY",
            !process.env.SHREESMS_SENDER_ID && "SHREESMS_SENDER_ID",
            !process.env.SHREESMS_ENTITY_ID && "SHREESMS_ENTITY_ID",
            !process.env.SHREESMS_TEMPLATE_ID && "SHREESMS_TEMPLATE_ID",
        ].filter(Boolean);
        if (missing.length > 0) {
            const error = `Cannot send SMS via ShreeSMS: missing env var(s) ${missing.join(", ")}`;
            console.error(error);
            return { success: false, otp: null, error };
        }

        const mobile = mobileNumber.replace(/\D/g, "").slice(-10);

        const url = `${SHREESMS_URL}` +
        `?APIkey=${process.env.SHREESMS_API_KEY}` +
        `&SenderID=${process.env.SHREESMS_SENDER_ID}` +
        `&SMSType=OTP_Transaction` + // Service Implicit
        `&Mobile=+91${mobile}` +
        `&MsgText=${encodeURIComponent(buildOtpMessage(otp))}` +
        `&EntityID=${process.env.SHREESMS_ENTITY_ID}` +
        `&TemplateID=${process.env.SHREESMS_TEMPLATE_ID}`;

        const response = await axios.get(url);
        console.log("ShreeSMS response:", response.data);

        if (response.data.startsWith("ok|")) {
            const addOtpVerificationResult = await addOtpVerification(mobileNumber, otp);
            if (!addOtpVerificationResult) {
                return { success: false, otp: null, error: "Failed to add OTP verification" };
            }
            return { success: true, otp, response: response.data };
        } else {
            return { success: false, otp: null, error: response.data };
        }
    } catch (error) {
        console.error(
            "ShreeSMS OTP send error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

async function addOtpVerification(mobileNumber, otp) {
    try {
        await OtpVerification.findOneAndUpdate(
            { mobileNumber },
            {
                $set: {
                    otp,
                    expiresAt: Date.now() + (otpExpiryMinutes * 60 * 1000),
                    isVerified: false,
                    attempts: 0,
                    updatedAt: Date.now()
                }
            },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        console.error("Error in addOtpVerification:", error.message);
        return false;
    }
}

async function verifyOtpDB(mobileNumber, otp) {
    try {
        const otpVerification = await OtpVerification.findOne({ mobileNumber });
        if (!otpVerification) {
            return {
                status: false,
                message: "Generate OTP first"
            };
        }
        if (otpVerification.otp !== otp) {
            otpVerification.attempts++;
            await otpVerification.save();
            if (otpVerification.attempts >= 3) {
                await OtpVerification.deleteOne({ mobileNumber });
                return {
                    status: false,
                    message: "Too many attempts"
                };
            }
            return {
                status: false,
                message: "Invalid OTP"
            };
        }
        if (otpVerification.expiresAt < Date.now()) {
            await OtpVerification.deleteOne({ mobileNumber });
            return {
                status: false,
                message: "OTP has expired"
            };
        }
        await OtpVerification.deleteOne({ mobileNumber });
        return {
            status: true,
            message: "OTP verified successfully"
        };
    } catch (error) {
        console.error("Error:", error.message);
        return {
            status: false,
            message: "Failed to verify OTP"
        };
    }
}

module.exports = { sendOtpSms, addOtpVerification, verifyOtpDB };
