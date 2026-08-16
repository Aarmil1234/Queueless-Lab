const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test with existing data
async function testNewRouteOnly() {
    console.log('🧪 Testing ONLY the new parameter range route...\n');
    
    try {
        // First, let's get existing parameters
        console.log('📋 Getting existing parameters...');
        const paramsResponse = await axios.get(`${BASE_URL}/parameter`);
        
        if (paramsResponse.data && paramsResponse.data.length > 0) {
            const firstParam = paramsResponse.data[0];
            console.log(`✅ Found parameter: ${firstParam.name} (${firstParam._id})`);
            
            // Get subcategories for this parameter
            console.log('\n📋 Getting subcategories...');
            try {
                const subCatResponse = await axios.get(`${BASE_URL}/parameter/subCategory/${firstParam._id}`);
                
                if (subCatResponse.data && subCatResponse.data.length > 0) {
                    const firstSubCat = subCatResponse.data[0];
                    console.log(`✅ Found subcategory: ${firstSubCat.name} (${firstSubCat._id})`);
                    
                    // Now test the NEW route
                    console.log('\n🎯 Testing NEW route: Get ranges by parameter AND subcategory...');
                    try {
                        const newRouteResponse = await axios.get(
                            `${BASE_URL}/parameter/defaultParameter/${firstParam._id}/subcategory/${firstSubCat._id}`
                        );
                        
                        console.log('✅ NEW ROUTE SUCCESS!');
                        console.log(`Status: ${newRouteResponse.status}`);
                        console.log(`Found ${newRouteResponse.data.length} ranges`);
                        
                        if (newRouteResponse.data.length > 0) {
                            console.log('Sample range:', {
                                parameterId: newRouteResponse.data[0].parameterId,
                                subCategoryId: newRouteResponse.data[0].subCategoryId,
                                gender: newRouteResponse.data[0].gender,
                                minValue: newRouteResponse.data[0].minValue,
                                maxValue: newRouteResponse.data[0].maxValue
                            });
                        }
                        
                        // Compare with existing route
                        console.log('\n📊 Comparing with existing route (all ranges for parameter)...');
                        const existingRouteResponse = await axios.get(
                            `${BASE_URL}/parameter/defaultParameter/${firstParam._id}`
                        );
                        
                        console.log(`Existing route found ${existingRouteResponse.data.length} ranges`);
                        
                        if (existingRouteResponse.data.length > newRouteResponse.data.length) {
                            console.log('✅ NEW route correctly filters by subcategory!');
                            console.log(`   New route: ${newRouteResponse.data.length} ranges (filtered)`);
                            console.log(`   Existing route: ${existingRouteResponse.data.length} ranges (all)`);
                        }
                        
                        return true;
                        
                    } catch (error) {
                        console.log('❌ NEW ROUTE FAILED:', error.response?.data || error.message);
                        return false;
                    }
                    
                } else {
                    console.log('❌ No subcategories found for this parameter');
                    return false;
                }
                
            } catch (error) {
                console.log('❌ Failed to get subcategories:', error.response?.data || error.message);
                return false;
            }
            
        } else {
            console.log('❌ No parameters found. Please create some parameters first.');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Failed to get parameters:', error.response?.data || error.message);
        return false;
    }
}

// Run the test
testNewRouteOnly().then(success => {
    if (success) {
        console.log('\n🎉 NEW PARAMETER RANGE ROUTE IS WORKING CORRECTLY!');
    } else {
        console.log('\n⚠️ NEW ROUTE TEST FAILED');
    }
}).catch(console.error);
