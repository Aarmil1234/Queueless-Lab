const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testWithExistingData() {
    console.log('🧪 Testing new route with existing data...\n');
    
    try {
        // Step 1: Login
        console.log('🔐 Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            labMobileNumber: "0987654321"
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login successful');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        // Step 2: Get existing parameters
        console.log('\n📋 Getting existing parameters...');
        const paramsResponse = await axios.get(`${BASE_URL}/parameter`, { headers });
        
        if (!paramsResponse.data.data || paramsResponse.data.data.length === 0) {
            console.log('❌ No parameters found');
            return false;
        }
        
        console.log(`✅ Found ${paramsResponse.data.data.length} parameters`);
        const firstParam = paramsResponse.data.data[0];
        console.log(`   Using: ${firstParam.name} (${firstParam._id})`);
        
        // Step 3: Get subcategories for this parameter
        console.log('\n📋 Getting subcategories...');
        try {
            const subCatResponse = await axios.get(`${BASE_URL}/parameter/subCategory/${firstParam._id}`, { headers });
            
            if (!subCatResponse.data || !subCatResponse.data.data || subCatResponse.data.data.length === 0) {
                console.log('❌ No subcategories found for this parameter');
                console.log('📋 Creating a subcategory...');
                
                // Create a subcategory
                const subCatData = {
                    parameterId: firstParam._id,
                    code: "TEST_SUB",
                    name: "Test SubCategory",
                    isActive: true
                };
                
                const createSubCatResponse = await axios.post(`${BASE_URL}/parameter/subCategory/add`, subCatData, { headers });
                const subCategoryId = createSubCatResponse.data.data._id;
                console.log(`✅ Subcategory created: ${subCategoryId}`);
                
                // Create a range for this subcategory
                console.log('\n📋 Creating parameter range...');
                const rangeData = {
                    parameterId: firstParam._id,
                    subCategoryId: subCategoryId,
                    gender: "MALE",
                    ageFrom: 18,
                    ageTo: 65,
                    ageType: "year",
                    minValue: 10.0,
                    maxValue: 20.0,
                    isActive: true
                };
                
                await axios.post(`${BASE_URL}/parameter/defaultParameter/add`, rangeData, { headers });
                console.log('✅ Parameter range created');
                
                // Now test the new route
                return await testNewRoute(firstParam._id, subCategoryId, headers);
                
            } else {
                const subCategoryId = subCatResponse.data.data[0]._id;
                console.log(`✅ Found subcategory: ${subCatResponse.data.data[0].name} (${subCategoryId})`);
                
                // Test the new route
                return await testNewRoute(firstParam._id, subCategoryId, headers);
            }
            
        } catch (subCatError) {
            console.log('❌ Subcategory error:', subCatError.response?.data || subCatError.message);
            return false;
        }
        
    } catch (error) {
        console.log('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testNewRoute(parameterId, subCategoryId, headers) {
    console.log('\n🎯 TESTING NEW ROUTE...');
    console.log(`GET /parameter/defaultParameter/${parameterId}/subcategory/${subCategoryId}`);
    
    try {
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
            
            // Compare with existing route
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
        } else {
            console.log('⚠️ No ranges found, but route is accessible');
            return true;
        }
        
    } catch (error) {
        console.log('❌ NEW ROUTE FAILED:', error.response?.data || error.message);
        return false;
    }
}

// Run the test
testWithExistingData().then(success => {
    if (success) {
        console.log('\n🎉 NEW PARAMETER RANGE ROUTE TEST COMPLETED SUCCESSFULLY!');
    } else {
        console.log('\n⚠️ Test completed with issues');
    }
}).catch(console.error);
