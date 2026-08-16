# Dynamic Parameter System Tests

This test suite validates the new dynamic parameter system for medical reports.

## Prerequisites

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Environment Variables**: Create a `.env` file in the project root with:
   ```
   MONGODB_URI=mongodb://localhost:27017/queueless-lab
   ```

## Running Tests

### Option 1: Direct Execution
```bash
cd test
node dynamicParameterSystem.js
```

### Option 2: Using npm script
```bash
cd test
npm test
```

### Option 3: From project root
```bash
node test/dynamicParameterSystem.js
```

## Test Coverage

The test suite covers the following scenarios:

### 1. **Dynamic Test Creation**
- Creates tests with parameter references
- Validates parameter relationships
- Tests test code uniqueness

### 2. **Report Creation with Dynamic Tests**
- Creates reports using test definitions
- Auto-populates parameters from test definitions
- Validates lab-specific isolation

### 3. **Backward Compatibility**
- Tests traditional `testResult` format
- Ensures existing integrations continue working
- Validates data preservation

### 4. **Dynamic Parameter Results**
- Tests new `testParameters` array format
- Validates parameter and subcategory references
- Tests status tracking and notes

### 5. **Data Retrieval**
- Tests report retrieval by ID
- Validates both legacy and new data structures
- Tests lab-specific filtering

### 6. **Lab Isolation**
- Ensures reports are isolated by lab ID
- Tests data security boundaries
- Validates multi-tenant functionality

## Expected Output

```
🚀 Starting Dynamic Parameter System Tests

✅ Connected to MongoDB
🧹 Cleaning up test data...
✅ Cleanup completed
📋 Setting up test data...
✅ Test data setup completed

🧪 Test 1: Creating Dynamic Test
✅ Create Dynamic Test: Test created successfully

🧪 Test 2: Creating Report with Dynamic Test
✅ Create Report with Dynamic Test: Report created with auto-populated parameters
✅ Auto-populated Parameters: Found 3 parameters

🧪 Test 3: Adding Traditional Test Result
✅ Add Traditional Test Result: Traditional testResult added successfully

🧪 Test 4: Adding Dynamic Test Result
✅ Add Dynamic Test Result: Dynamic testParameters added successfully
✅ Dynamic Parameter Validation: All 3 parameters stored correctly

🧪 Test 5: Retrieving and Validating Report Data
✅ Retrieve Report by ID: Report retrieved successfully
✅ Backward Compatibility (testResult): Legacy testResult preserved
✅ Dynamic Structure (testParameters): Found 3 dynamic parameters
✅ Parameter Data Integrity: Parameter data structure valid

🧪 Test 6: Lab-Specific Data Isolation
✅ Lab Isolation (Empty Result): Correctly isolated lab data
✅ Lab Isolation (Correct Lab): Found 1 reports for test lab

📊 Test Results Summary:
Total Tests: 6
✅ Passed: 6
❌ Failed: 0
Success Rate: 100.0%

🎉 All tests passed! Dynamic Parameter System is working correctly.
```

## Test Data Created

During testing, the following test data is created and automatically cleaned up:

### Parameters
- **HB** (Hemoglobin) - CBC category
- **WBC** (White Blood Cells) - CBC category  
- **RBC** (Red Blood Cells) - CBC category

### SubCategories
- **HB_MALE** - Hemoglobin Male Range
- **HB_FEMALE** - Hemoglobin Female Range

### Tests
- **Complete Blood Count** (CBC_FULL) - With 3 parameters
- **Liver Function Test** (LFT_BASIC) - With 2 parameters

### Reports
- Test report with dynamic parameters
- Test patient (if not exists)

## Troubleshooting

### Connection Issues
```
❌ Failed to connect to MongoDB: Connection refused
```
**Solution**: Ensure MongoDB is running and connection string is correct.

### Missing Dependencies
```
Error: Cannot find module 'dotenv'
```
**Solution**: Install dependencies:
```bash
cd test
npm install
```

### Test Failures
If tests fail, check:
1. MongoDB connection is active
2. Environment variables are set correctly
3. Models and database functions are properly imported
4. No conflicting data in the database

## Manual Testing

After running automated tests, you can manually verify:

### 1. Check Created Test
```javascript
const Test = require('../models/test');
const tests = await Test.find({}).populate('parameters');
console.log(JSON.stringify(tests, null, 2));
```

### 2. Check Report Structure
```javascript
const Report = require('../models/reports');
const reports = await Report.find({}).populate('testReport.testId');
console.log(JSON.stringify(reports, null, 2));
```

### 3. Verify Lab Isolation
```javascript
const { getAllPatientReportDB } = require('../db/report/report');
const labReports = await getAllPatientReportDB('test-lab-123');
console.log('Lab reports:', labReports.data.length);
```

## Integration Testing

To test with actual API endpoints:

1. Start your application server
2. Use Postman/curl to test endpoints:
   - `POST /api/test/create`
   - `POST /api/report/create`
   - `POST /api/report/add`
   - `GET /api/report/:reportId`

See `docs/dynamicParameterSystem.md` for API usage examples.
