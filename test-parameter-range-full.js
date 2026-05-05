const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';

// Test data
const testLab = {
    labName: "Test Lab",
    ownerName: "Test Owner",
    mobileNumber: "+1234567890",
    labMobileNumber: "+0987654321",
    email: "test@lab.com",
    password: "testPassword123"
};

const testParameter = {
    code: "TEST_PARAM",
    name: "Test Parameter",
    category: "Test Category",
    type: "NUMERIC",
    unit: "mg/dL",
    isActive: true
};

const testSubCategory = {
    code: "TEST_SUB",
    name: "Test SubCategory",
    isActive: true
};

const testRange = {
    gender: "MALE",
    ageFrom: 18,
    ageTo: 65,
    ageType: "year",
    minValue: 10.0,
    maxValue: 20.0,
    isActive: true
};

let authToken = '';
let labId = '';
let parameterId = '';
let subCategoryId = '';
let rangeId = '';

// Helper function to make API calls
async function apiCall(method, url, data = null, headers = {}) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message, 
            status: error.response?.status || 500 
        };
    }
}

// Test functions
async function testLabSignup() {
    console.log('🧪 1. Testing Lab Signup...');
    const result = await apiCall('POST', '/auth/signup', testLab);
    
    if (result.success) {
        authToken = result.data.data.token;
        labId = result.data.data.user.id;
        console.log('✅ Lab signup successful');
        console.log('   Token:', authToken.substring(0, 20) + '...');
        return true;
    } else {
        console.log('❌ Lab signup failed:', result.error);
        return false;
    }
}

async function testLabLogin() {
    console.log('\n🧪 2. Testing Lab Login...');
    const result = await apiCall('POST', '/auth/login', { 
        labMobileNumber: testLab.labMobileNumber 
    });
    
    if (result.success) {
        authToken = result.data.data.token;
        console.log('✅ Lab login successful');
        return true;
    } else {
        console.log('❌ Lab login failed:', result.error);
        return false;
    }
}

async function testAddParameter() {
    console.log('\n🧪 3. Testing Add Parameter...');
    const result = await apiCall('POST', '/parameter/add', testParameter, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success) {
        parameterId = result.data.data._id;
        console.log('✅ Parameter added successfully');
        console.log('   Parameter ID:', parameterId);
        return true;
    } else {
        console.log('❌ Add parameter failed:', result.error);
        return false;
    }
}

async function testAddSubCategory() {
    console.log('\n🧪 4. Testing Add SubCategory...');
    const subCategoryData = {
        ...testSubCategory,
        parameterId: parameterId
    };
    
    const result = await apiCall('POST', '/parameter/subCategory/add', subCategoryData, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success) {
        subCategoryId = result.data.data._id;
        console.log('✅ SubCategory added successfully');
        console.log('   SubCategory ID:', subCategoryId);
        return true;
    } else {
        console.log('❌ Add subcategory failed:', result.error);
        return false;
    }
}

async function testAddParameterRange() {
    console.log('\n🧪 5. Testing Add Parameter Range...');
    const rangeData = {
        ...testRange,
        parameterId: parameterId,
        subCategoryId: subCategoryId
    };
    
    const result = await apiCall('POST', '/parameter/defaultParameter/add', rangeData, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success) {
        console.log('✅ Parameter range added successfully');
        return true;
    } else {
        console.log('❌ Add parameter range failed:', result.error);
        return false;
    }
}

async function testGetRangesByParameter() {
    console.log('\n🧪 6. Testing Get Ranges by Parameter ID...');
    const result = await apiCall('GET', `/parameter/defaultParameter/${parameterId}`, null, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success && result.data.length > 0) {
        rangeId = result.data[0]._id;
        console.log('✅ Get ranges by parameter successful');
        console.log('   Found', result.data.length, 'ranges');
        console.log('   First range ID:', rangeId);
        return true;
    } else {
        console.log('❌ Get ranges by parameter failed:', result.error);
        return false;
    }
}

async function testGetRangesByParameterAndSubCategory() {
    console.log('\n🧪 7. Testing Get Ranges by Parameter AND SubCategory (NEW ROUTE)...');
    const result = await apiCall('GET', `/parameter/defaultParameter/${parameterId}/subcategory/${subCategoryId}`, null, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success && result.data.length > 0) {
        console.log('✅ Get ranges by parameter and subcategory successful!');
        console.log('   Found', result.data.length, 'ranges');
        console.log('   Range details:', {
            parameterId: result.data[0].parameterId,
            subCategoryId: result.data[0].subCategoryId,
            gender: result.data[0].gender,
            minValue: result.data[0].minValue,
            maxValue: result.data[0].maxValue
        });
        return true;
    } else {
        console.log('❌ Get ranges by parameter and subcategory failed:', result.error);
        return false;
    }
}

async function testGetRangesByParameterAndSubCategoryWithNull() {
    console.log('\n🧪 8. Testing Add Range without SubCategory...');
    const rangeDataWithoutSub = {
        ...testRange,
        parameterId: parameterId,
        subCategoryId: null,
        gender: "BOTH"
    };
    
    const result = await apiCall('POST', '/parameter/defaultParameter/add', rangeDataWithoutSub, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success) {
        console.log('✅ Range without subcategory added successfully');
        
        console.log('\n🧪 9. Testing Get Ranges with null SubCategory...');
        const getResult = await apiCall('GET', `/parameter/defaultParameter/${parameterId}/subcategory/null`, null, {
            'Authorization': `Bearer ${authToken}`
        });
        
        if (getResult.success && getResult.data.length > 0) {
            console.log('✅ Get ranges with null subcategory successful!');
            console.log('   Found', getResult.data.length, 'ranges');
            return true;
        } else {
            console.log('❌ Get ranges with null subcategory failed:', getResult.error);
            return false;
        }
    } else {
        console.log('❌ Add range without subcategory failed:', result.error);
        return false;
    }
}

async function testGetSingleRange() {
    console.log('\n🧪 10. Testing Get Single Range...');
    const result = await apiCall('GET', `/parameter/defaultParameter/${parameterId}/${rangeId}`, null, {
        'Authorization': `Bearer ${authToken}`
    });
    
    if (result.success) {
        console.log('✅ Get single range successful');
        console.log('   Range:', {
            gender: result.data[0].gender,
            minValue: result.data[0].minValue,
            maxValue: result.data[0].maxValue
        });
        return true;
    } else {
        console.log('❌ Get single range failed:', result.error);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Parameter Range API Tests...\n');
    
    const tests = [
        testLabSignup,
        testLabLogin,
        testAddParameter,
        testAddSubCategory,
        testAddParameterRange,
        testGetRangesByParameter,
        testGetRangesByParameterAndSubCategory,
        testGetRangesByParameterAndSubCategoryWithNull,
        testGetSingleRange
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.log('❌ Test failed with exception:', error.message);
            failed++;
        }
    }
    
    console.log('\n📊 Test Results:');
    console.log('✅ Passed:', passed);
    console.log('❌ Failed:', failed);
    console.log('📈 Success Rate:', ((passed / (passed + failed)) * 100).toFixed(1) + '%');
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! The new parameter range route is working correctly!');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the errors above.');
    }
}

// Run the tests
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    testGetRangesByParameterAndSubCategory
};
