const axios = require('axios');
require('dotenv').config();

async function connectWhatsApp() {

    try {

        const response = await axios.post(
            'https://app.aibotick.com/api/v1/whatsapp/account/connect',
            {
                apiToken: process.env.AIBOTICK_API_KEY,
                user_id: process.env.AIBOTICK_USER_ID,
                whatsapp_business_account_id: process.env.WABA_ID,
                access_token: process.env.META_ACCESS_TOKEN
            }
        );

        console.log(response.data);

    } catch (error) {

        console.log(error.response?.data || error.message);

    }

}

connectWhatsApp();