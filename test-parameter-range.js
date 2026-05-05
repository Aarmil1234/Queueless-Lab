const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TOKEN = 'your_auth_token_here'; // Replace with actual token
const PARAMETER_ID = 'your_parameter_id_here'; // Replace with actual parameter ID
const SUBCATEGORY_ID = 'your_subcategory_id_here'; // Replace with actual subcategory ID

// Test the new route
async function testParameterRangeBySubCategory() {
    try {
        console.log('🧪 Testing parameter range by subcategory...');
        
        const response = await axios.get(
            `${BASE_URL}/parameter/defaultParameter/${PARAMETER_ID}/subcategory/${SUBCATEGORY_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Success! Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

// Run test
testParameterRangeBySubCategory();
