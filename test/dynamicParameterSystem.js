const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Parameter = require('../models/parameter');
const ParameterSubCategory = require('../models/parameterSubCategoryModel');
const Test = require('../models/test');
const Report = require('../models/reports');
const Patient = require('../models/patient');

// Import database functions
const { createTestDb, getAllTestsDb, getTestByIdDb } = require('../db/test/testDb');
const { createNewReportDb, addPatientReportDb, getAllPatientReportDB, getReportByIdDB } = require('../db/report/report');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/queueless-lab';
const TEST_LAB_ID = 'test-lab-123';
const TEST_PATIENT_CASE_ID = 'TEST-PATIENT-COMP-001';

class DynamicParameterSystemTest {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0
        };
        this.createdIds = {
            parameters: [],
            subCategories: [],
            tests: [],
            reports: []
        };
    }

    async connect() {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('✅ Connected to MongoDB');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error.message);
            return false;
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }

    async cleanup() {
        console.log('\n🧹 Cleaning up test data...');
        try {
            // Clean up in reverse order of dependencies
            await Report.deleteMany({ labId: TEST_LAB_ID });
            await Test.deleteMany({ delete: false });
            await ParameterSubCategory.deleteMany({ delete: false });
            await Parameter.deleteMany({ delete: false });
            await Patient.deleteOne({ caseId: TEST_PATIENT_CASE_ID });
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }

    logTest(testName, success, message = '') {
        this.testResults.total++;
        if (success) {
            this.testResults.passed++;
            console.log(`✅ ${testName}: ${message}`);
        } else {
            this.testResults.failed++;
            console.log(`❌ ${testName}: ${message}`);
        }
    }

    async setupTestData() {
        console.log('\n📋 Setting up test data...');

        try {
            // 1. Create test parameters
            const hemoglobin = await Parameter.create({
                code: 'HB',
                name: 'Hemoglobin',
                category: 'CBC',
                type: 'NUMERIC',
                unit: 'g/dL',
                isActive: true
            });
            this.createdIds.parameters.push(hemoglobin._id);

            const wbc = await Parameter.create({
                code: 'WBC',
                name: 'White Blood Cells',
                category: 'CBC',
                type: 'NUMERIC',
                unit: 'cells/μL',
                isActive: true
            });
            this.createdIds.parameters.push(wbc._id);

            const rbc = await Parameter.create({
                code: 'RBC',
                name: 'Red Blood Cells',
                category: 'CBC',
                type: 'NUMERIC',
                unit: 'million cells/μL',
                isActive: true
            });
            this.createdIds.parameters.push(rbc._id);

            // 2. Create subcategories for hemoglobin
            const hbMale = await ParameterSubCategory.create({
                parameterId: hemoglobin._id,
                code: 'HB_MALE',
                name: 'Hemoglobin Male Range'
            });
            this.createdIds.subCategories.push(hbMale._id);

            const hbFemale = await ParameterSubCategory.create({
                parameterId: hemoglobin._id,
                code: 'HB_FEMALE',
                name: 'Hemoglobin Female Range'
            });
            this.createdIds.subCategories.push(hbFemale._id);

            // 3. Create a test with parameters
            const cbcTest = await Test.create({
                testName: 'Complete Blood Count',
                testCode: 'CBC_FULL',
                category: 'Hematology',
                parameters: [hemoglobin._id, wbc._id, rbc._id],
                isActive: true
            });
            this.createdIds.tests.push(cbcTest._id);

            // 4. Create a test patient (if not exists)
            let patient = await Patient.findOne({ caseId: TEST_PATIENT_CASE_ID });
            if (!patient) {
                patient = await Patient.create({
                    caseId: TEST_PATIENT_CASE_ID,
                    patientName: 'Test Patient',
                    mobileNumber: '1234567890',
                    age: 30,
                    gender: 'Male',
                    ageType: 'year',
                    dateOfBirth: new Date('1994-01-01'),
                    referredByDoctor: 'Test Doctor',
                    doctorContactNo: '9876543210',
                    address: 'Test Address',
                    city: 'Test City'
                });
            }
            this.createdIds.patientId = patient._id.toString();

            console.log('✅ Test data setup completed');
            return true;
        } catch (error) {
            console.error('❌ Test data setup failed:', error.message);
            return false;
        }
    }

    async test1_CreateDynamicTest() {
        console.log('\n🧪 Test 1: Creating Dynamic Test');
        
        try {
            const testData = {
                testName: 'Liver Function Test',
                testCode: 'LFT_BASIC',
                category: 'Biochemistry',
                parameters: this.createdIds.parameters.slice(0, 2) // Use first 2 parameters
            };

            const result = await createTestDb(testData);
            
            this.logTest(
                'Create Dynamic Test',
                result.statusCode !== 401,
                result.statusCode === 201 ? 'Test created successfully' : 'Failed to create test'
            );

            if (result.statusCode === 201) {
                this.createdIds.tests.push(result.data._id);
            }

            return result.statusCode === 201;
        } catch (error) {
            this.logTest('Create Dynamic Test', false, error.message);
            return false;
        }
    }

    async test2_CreateReportWithDynamicTest() {
        console.log('\n🧪 Test 2: Creating Report with Dynamic Test');
        
        try {
            const reportData = {
                patientId: this.createdIds.patientId,
                labId: TEST_LAB_ID,
                tests: [
                    {
                        testName: 'Complete Blood Count',
                        testId: this.createdIds.tests[0] // CBC test
                    }
                ]
            };

            const result = await createNewReportDb(
                reportData.patientId, 
                reportData.tests, 
                reportData.labId
            );

            const success = result.statusCode === 201;
            this.logTest(
                'Create Report with Dynamic Test',
                success,
                success ? 'Report created with auto-populated parameters' : 'Failed to create report'
            );

            if (success) {
                this.createdIds.reports.push(result.data._id);
                
                // Verify that testParameters were populated
                const report = result.data;
                const testEntry = report.testReport[0];
                const hasTestParameters = testEntry.testParameters && testEntry.testParameters.length > 0;
                
                this.logTest(
                    'Auto-populated Parameters',
                    hasTestParameters,
                    hasTestParameters ? `Found ${testEntry.testParameters.length} parameters` : 'No parameters found'
                );
            }

            return success;
        } catch (error) {
            this.logTest('Create Report with Dynamic Test', false, error.message);
            return false;
        }
    }

    async test3_AddTraditionalTestResult() {
        console.log('\n🧪 Test 3: Adding Traditional Test Result (Backward Compatibility)');
        
        try {
            if (this.createdIds.reports.length === 0) {
                this.logTest('Add Traditional Test Result', false, 'No report available');
                return false;
            }

            const reportId = this.createdIds.reports[0];
            const report = await Report.findById(reportId);
            const testId = report.testReport[0]._id.toString();

            const resultData = {
                reportId,
                testId,
                labId: TEST_LAB_ID,
                testResult: {
                    'hemoglobin': '14.5',
                    'wbc': '7500',
                    'rbc': '4.8'
                }
            };

            const result = await addPatientReportDb(resultData);

            const success = result.success !== false;
            this.logTest(
                'Add Traditional Test Result',
                success,
                success ? 'Traditional testResult added successfully' : `Failed: ${result.message || result.error || 'Unknown error'}`
            );

            return success;
        } catch (error) {
            this.logTest('Add Traditional Test Result', false, error.message);
            return false;
        }
    }

    async test4_AddDynamicTestResult() {
        console.log('\n🧪 Test 4: Adding Dynamic Test Result');
        
        try {
            if (this.createdIds.reports.length === 0) {
                this.logTest('Add Dynamic Test Result', false, 'No report available');
                return false;
            }

            const reportId = this.createdIds.reports[0];
            const report = await Report.findById(reportId);
            const testId = report.testReport[0]._id.toString();

            const resultData = {
                reportId,
                testId,
                labId: TEST_LAB_ID,
                testParameters: [
                    {
                        parameterId: this.createdIds.parameters[0], // Hemoglobin
                        subCategoryId: this.createdIds.subCategories[0], // HB_MALE
                        value: '14.5',
                        status: 'NORMAL',
                        notes: 'Within normal range for adult male'
                    },
                    {
                        parameterId: this.createdIds.parameters[1], // WBC
                        value: '7500',
                        status: 'NORMAL',
                        notes: 'Normal white blood cell count'
                    },
                    {
                        parameterId: this.createdIds.parameters[2], // RBC
                        value: '4.8',
                        status: 'ABNORMAL',
                        notes: 'Slightly elevated RBC count'
                    }
                ]
            };

            const result = await addPatientReportDb(resultData);

            const success = result.success !== false;
            this.logTest(
                'Add Dynamic Test Result',
                success,
                success ? 'Dynamic testParameters added successfully' : `Failed: ${result.message || result.error || 'Unknown error'}`
            );

            if (success) {
                // Verify the data was stored correctly
                const updatedReport = await Report.findById(reportId);
                const testEntry = updatedReport.testReport[0];
                const hasValidParameters = testEntry.testParameters.length === 3;
                
                this.logTest(
                    'Dynamic Parameter Validation',
                    hasValidParameters,
                    hasValidParameters ? 'All 3 parameters stored correctly' : 'Parameter data mismatch'
                );
            }

            return success;
        } catch (error) {
            this.logTest('Add Dynamic Test Result', false, error.message);
            return false;
        }
    }

    async test5_RetrieveAndValidateReport() {
        console.log('\n🧪 Test 5: Retrieving and Validating Report Data');
        
        try {
            if (this.createdIds.reports.length === 0) {
                this.logTest('Retrieve Report', false, 'No report available');
                return false;
            }

            const reportId = this.createdIds.reports[0];

            // Test getReportByIdDB
            const report = await getReportByIdDB(reportId, TEST_LAB_ID);
            
            const hasReport = report && report._id;
            this.logTest(
                'Retrieve Report by ID',
                hasReport,
                hasReport ? 'Report retrieved successfully' : 'Failed to retrieve report'
            );

            if (hasReport) {
                // Check backward compatibility
                const hasTestResult = report.testReport && report.testReport[0].testResult;
                this.logTest(
                    'Backward Compatibility (testResult)',
                    hasTestResult,
                    hasTestResult ? 'Legacy testResult preserved' : 'Legacy testResult missing'
                );

                // Check new dynamic structure
                const hasTestParameters = report.testReport && report.testReport[0].testParameters;
                const parameterCount = hasTestParameters ? report.testReport[0].testParameters.length : 0;
                this.logTest(
                    'Dynamic Structure (testParameters)',
                    hasTestParameters,
                    hasTestParameters ? `Found ${parameterCount} dynamic parameters` : 'Dynamic parameters missing'
                );

                // Validate parameter data integrity
                if (hasTestParameters && parameterCount > 0) {
                    const firstParam = report.testReport[0].testParameters[0];
                    const hasRequiredFields = firstParam.parameterId && firstParam.value !== undefined;
                    this.logTest(
                        'Parameter Data Integrity',
                        hasRequiredFields,
                        hasRequiredFields ? 'Parameter data structure valid' : 'Parameter data incomplete'
                    );
                }
            }

            return hasReport;
        } catch (error) {
            this.logTest('Retrieve Report', false, error.message);
            return false;
        }
    }

    async test6_LabSpecificIsolation() {
        console.log('\n🧪 Test 6: Lab-Specific Data Isolation');
        
        try {
            // Test with different lab ID - should return empty
            const result = await getAllPatientReportDB('different-lab-id');
            
            const isEmpty = !result.data || result.data.length === 0;
            this.logTest(
                'Lab Isolation (Empty Result)',
                isEmpty,
                isEmpty ? 'Correctly isolated lab data' : 'Lab isolation failed'
            );

            // Test with correct lab ID - should return our test report
            const correctResult = await getAllPatientReportDB(TEST_LAB_ID);
            
            const hasData = correctResult.data && correctResult.data.length > 0;
            this.logTest(
                'Lab Isolation (Correct Lab)',
                hasData,
                hasData ? `Found ${correctResult.data.length} reports for test lab` : 'No reports found for test lab'
            );

            return isEmpty && hasData;
        } catch (error) {
            this.logTest('Lab Isolation', false, error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🚀 Starting Dynamic Parameter System Tests\n');
        
        const connected = await this.connect();
        if (!connected) return;

        try {
            await this.cleanup();
            await this.setupTestData();

            // Run all tests
            await this.test1_CreateDynamicTest();
            await this.test2_CreateReportWithDynamicTest();
            await this.test3_AddTraditionalTestResult();
            await this.test4_AddDynamicTestResult();
            await this.test5_RetrieveAndValidateReport();
            await this.test6_LabSpecificIsolation();

            // Print final results
            console.log('\n📊 Test Results Summary:');
            console.log(`Total Tests: ${this.testResults.total}`);
            console.log(`✅ Passed: ${this.testResults.passed}`);
            console.log(`❌ Failed: ${this.testResults.failed}`);
            console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

            if (this.testResults.failed === 0) {
                console.log('\n🎉 All tests passed! Dynamic Parameter System is working correctly.');
            } else {
                console.log('\n⚠️  Some tests failed. Please review the implementation.');
            }

        } finally {
            await this.cleanup();
            await this.disconnect();
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new DynamicParameterSystemTest();
    tester.runAllTests().catch(console.error);
}

module.exports = DynamicParameterSystemTest;
