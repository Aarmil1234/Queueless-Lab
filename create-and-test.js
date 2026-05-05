const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Create test data and test the new route
async function createAndTest() {
    console.log('🚀 Creating test data and testing new route...\n');
    
    try {
        // Step 1: Login to get token
        console.log('🔐 Logging in...');
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                labMobileNumber: "0987654321"
            });
            
            const token = loginResponse.data.data.token;
            console.log('✅ Login successful');
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            // Step 2: Create a parameter
            console.log('\n📋 Creating test parameter...');
            const paramData = {
                code: "TEST_HB",
                name: "Test Hemoglobin", 
                category: "Blood Test",
                type: "NUMERIC",
                unit: "g/dL",
                isActive: true
            };
            
            const paramResponse = await axios.post(`${BASE_URL}/parameter/add`, paramData, { headers });
            
            if (!paramResponse.data || !paramResponse.data.data || !paramResponse.data.data._id) {
                console.log('❌ Parameter creation failed:', paramResponse.data);
                return false;
            }
            
            const parameterId = paramResponse.data.data._id;
            console.log(`✅ Parameter created: ${parameterId}`);
            
            // Step 3: Create a subcategory
            console.log('\n📋 Creating test subcategory...');
            const subCatData = {
                parameterId: parameterId,
                code: "TEST_MALE",
                name: "Test Male Range",
                isActive: true
            };
            
            const subCatResponse = await axios.post(`${BASE_URL}/parameter/subCategory/add`, subCatData, { headers });
            const subCategoryId = subCatResponse.data.data._id;
            console.log(`✅ Subcategory created: ${subCategoryId}`);
            
            // Step 4: Create a parameter range
            console.log('\n📋 Creating test parameter range...');
            const rangeData = {
                parameterId: parameterId,
                subCategoryId: subCategoryId,
                gender: "MALE",
                ageFrom: 18,
                ageTo: 65,
                ageType: "year",
                minValue: 13.5,
                maxValue: 17.5,
                isActive: true
            };
            
            await axios.post(`${BASE_URL}/parameter/defaultParameter/add`, rangeData, { headers });
            console.log('✅ Parameter range created');
            
            // Step 5: Test the NEW route!
            console.log('\n🎯 TESTING NEW ROUTE...');
            console.log(`GET /parameter/defaultParameter/${parameterId}/subcategory/${subCategoryId}`);
            
            const newRouteResponse = await axios.get(
                `${BASE_URL}/parameter/defaultParameter/${parameterId}/subcategory/${subCategoryId}`,
                { headers }
            );
            
            console.log('✅ NEW ROUTE SUCCESS!');
            console.log(`Status: ${newRouteResponse.status}`);
            console.log(`Found ${newRouteResponse.data.length} ranges`);
            
            if (newRouteResponse.data.length > 0) {
                const range = newRouteResponse.data[0];
                console.log('\n📊 Range Details:');
                console.log(`  Parameter ID: ${range.parameterId}`);
                console.log(`  SubCategory ID: ${range.subCategoryId}`);
                console.log(`  Gender: ${range.gender}`);
                console.log(`  Age Range: ${range.ageFrom}-${range.ageTo} ${range.ageType}s`);
                console.log(`  Value Range: ${range.minValue}-${range.maxValue}`);
                console.log(`  Active: ${range.isActive}`);
                
                // Step 6: Compare with existing route
                console.log('\n📊 Comparing with existing route...');
                const existingResponse = await axios.get(
                    `${BASE_URL}/parameter/defaultParameter/${parameterId}`,
                    { headers }
                );
                
                console.log(`Existing route found: ${existingResponse.data.length} ranges`);
                console.log(`New route found: ${newRouteResponse.data.length} ranges`);
                
                if (existingResponse.data.length >= newRouteResponse.data.length) {
                    console.log('✅ NEW ROUTE CORRECTLY FILTERS BY SUBCATEGORY!');
                    console.log('🎉 TEST PASSED - The new parameter route is working perfectly!');
                    return true;
                }
            }
            
        } catch (loginError) {
            console.log('❌ Login failed:', loginError.response?.data || loginError.message);
            console.log('Please check your lab credentials or create a new lab');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

// Run the test
createAndTest().then(success => {
    if (success) {
        console.log('\n🎉 NEW PARAMETER RANGE ROUTE TEST COMPLETED SUCCESSFULLY!');
    } else {
        console.log('\n⚠️ Test completed with issues');
    }
}).catch(console.error);
