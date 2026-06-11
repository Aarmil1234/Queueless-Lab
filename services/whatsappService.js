// const axios = require('axios');

// const sendWhatsAppPDF = async (
//     mobileNumber,
//     pdfUrl,
//     fileName
// ) => {

//     try {

//         const response = await axios.get(
//             `https://app.aibotick.com/api/v1/whatsapp/send/template?apiToken=20970%7CrDt2wANWKITudrxzN14lwnFAFIgYMG2Pfm0lt5m36843b784&phone_number_id=728249873715160&template_id=356611&template_header_media_url=https%3A%2F%2Fbot-data.s3.ap-southeast-1.wasabisys.com%2Fflowbuilder%2F170167%2F278168%2Fwhatsapp-382327%2Fflowbuilder-278168-1781026504.pdf&phone_number=${'+' + mobileNumber}&username="Shweta"`,
//         );

//         return response.data;

//     } catch (error) {
//         console.log(error.response?.data || error.message);

//         throw error;

//     }

// };

// module.exports = {
//     sendWhatsAppPDF
// };


const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// console.log(fs.existsSync(pdfPath));

// const stats = fs.statSync(pdfPath);
// console.log("Size:", stats.size);

// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const sendWhatsAppPDF = async (
//     mobileNumber,
//     pdfPath,
//     userName
// ) => {

//     try {

//         // Upload PDF to Cloudinary
//         const uploadResult = await cloudinary.uploader.upload(
//             pdfPath,
//             {
//                 resource_type: "raw",
//                 folder: "reports",
//                 use_filename: true,
//             }
//         );
//         // console.log("uploadResult==", uploadResult);

//         const pdfUrl = uploadResult.secure_url;
//         console.log("pdfUrl", pdfUrl);

//         // Send WhatsApp template
//         const response = await axios.get(
//             `https://app.aibotick.com/api/v1/whatsapp/send/template?apiToken=20970%7CrDt2wANWKITudrxzN14lwnFAFIgYMG2Pfm0lt5m36843b784&phone_number_id=728249873715160&template_id=356611&template_header_media_url=${pdfUrl}&phone_number=${'+' + mobileNumber}`,
//             // {
//             //     params: {
//             //         apiToken: process.env.AIBOTICK_API_KEY,
//             //         phone_number_id: process.env.PHONE_NUMBER_ID,
//             //         template_id: "356611",
//             //         template_header_media_url: pdfUrl,
//             //         phone_number: "+" + mobileNumber,
//             //         // template_params: JSON.stringify([userName])
//             //     }
//             // }
//         );

//         return response.data;

//     } catch (error) {

//         console.log(error.response?.data || error.message);
//         throw error;

//     }

// };

const sendWhatsAppPDF = async (mobileNumber, pdfUrl, fileName) => {
    try {
        const encodedUrl = encodeURIComponent(pdfUrl);
        const phone = mobileNumber.startsWith("+") ? mobileNumber : `+${mobileNumber}`;

        const url = `https://app.aibotick.com/api/v1/whatsapp/send/template`
            + `?apiToken=20970%7CrDt2wANWKITudrxzN14lwnFAFIgYMG2Pfm0lt5m36843b784`
            + `&phone_number_id=728249873715160`
            + `&template_id=356611`
            + `&template_header_media_url=${encodedUrl}`
            + `&phone_number=${encodeURIComponent(phone)}`;  // ✅ encode the + sign too

            // console.log("url", url);            

        // console.log("Sending WhatsApp PDF:", { phone, fileName, pdfUrl });

        const response = await axios.get(url);
        return response.data;

    } catch (error) {
        console.error("WhatsApp API error:", error.response?.data || error.message);
        throw error;
    }
};

// const sendWhatsAppPDF = async (
//     mobileNumber,
//     pdfUrl,
//     userName
// ) => {
//     try {

//                 const encodedUrl = encodeURIComponent(pdfUrl);

//                 console.log("==UL++===",  `https://app.aibotick.com/api/v1/whatsapp/send/template?apiToken=20970%7CrDt2wANWKITudrxzN14lwnFAFIgYMG2Pfm0lt5m36843b784&phone_number_id=728249873715160&template_id=356611&template_header_media_url=${encodedUrl}&phone_number=${'+' + mobileNumber}`);
                
//                 console.log("Encoded PDF URL:", encodedUrl);
//         const response = await axios.get(
//             `https://app.aibotick.com/api/v1/whatsapp/send/template?apiToken=20970%7CrDt2wANWKITudrxzN14lwnFAFIgYMG2Pfm0lt5m36843b784&phone_number_id=728249873715160&template_id=356611&template_header_media_url=${encodedUrl}&phone_number=${'+' + mobileNumber}`
//         );

//         return response.data;

//     } catch (error) {
//         console.log(error.response?.data || error.message);
//         throw error;
//     }
// };

module.exports = {
    sendWhatsAppPDF
};