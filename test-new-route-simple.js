// Simple test for the new parameter range route
// This test assumes you have existing data in your database

const http = require('http');

// Test the new route
function testNewRoute() {
    console.log('🧪 Testing new parameter range route...');
    
    // Replace these with your actual IDs
    const PARAMETER_ID = 'your_parameter_id_here';
    const SUBCATEGORY_ID = 'your_subcategory_id_here';
    const TOKEN = 'your_auth_token_here';
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/parameter/defaultParameter/${PARAMETER_ID}/subcategory/${SUBCATEGORY_ID}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('Response:', JSON.stringify(jsonData, null, 2));
                
                if (res.statusCode === 200 && Array.isArray(jsonData)) {
                    console.log('✅ New route is working correctly!');
                    console.log(`Found ${jsonData.length} parameter ranges`);
                } else {
                    console.log('❌ Route test failed');
                }
            } catch (error) {
                console.log('Response data:', data);
                console.log('❌ Failed to parse response');
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
        console.log('\n💡 Make sure:');
        console.log('1. Your server is running on port 3000');
        console.log('2. You have valid parameter and subcategory IDs');
        console.log('3. You have a valid auth token');
    });
    
    req.end();
}

// Instructions
console.log('📋 Test Instructions:');
console.log('1. Start your server: npm start or node app.js');
console.log('2. Update the IDs and TOKEN in this script');
console.log('3. Run: node test-new-route-simple.js\n');

console.log('🔧 To get your IDs:');
console.log('- Parameter ID: GET /api/parameter');
console.log('- SubCategory ID: GET /api/parameter/subCategory/:parameterId');
console.log('- Auth Token: POST /api/auth/login\n');

// Run the test
testNewRoute();
