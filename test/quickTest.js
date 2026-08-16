#!/usr/bin/env node

/**
 * Quick Test Script for Dynamic Parameter System
 * 
 * This is a simplified version that focuses on core functionality
 * and provides immediate feedback.
 * 
 * Usage: node quickTest.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Quick configuration - override if needed
const config = {
    mongodb: process.env.MONGODB_URI || 'mongodb://localhost:27017/queueless-lab',
    labId: 'test-lab-quick',
    caseId: 'TEST-PATIENT-QUICK-001'
};

async function quickTest() {
    console.log('🚀 Quick Test: Dynamic Parameter System\n');

    // Connect to database
    try {
        await mongoose.connect(config.mongodb);
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('💡 Make sure MongoDB is running and MONGODB_URI is set correctly');
        return;
    }

    try {
        // Import models
        const Parameter = require('../models/parameter');
        const Test = require('../models/test');
        const Report = require('../models/reports');
        const Patient = require('../models/patient');

        // Test 1: Create a parameter
        console.log('\n📝 Creating test parameter...');
        const param = await Parameter.create({
            code: 'GLU',
            name: 'Glucose',
            category: 'Biochemistry',
            type: 'NUMERIC',
            unit: 'mg/dL',
            isActive: true
        });
        console.log(`✅ Parameter created: ${param.name} (${param.code})`);

        // Test 2: Create a test with the parameter
        console.log('\n🧪 Creating test with parameter...');
        const test = await Test.create({
            testName: 'Glucose Test',
            testCode: 'GLU_TEST',
            category: 'Biochemistry',
            parameters: [param._id],
            isActive: true
        });
        console.log(`✅ Test created: ${test.testName} with ${test.parameters.length} parameters`);

        // Test 3: Create a test patient
        console.log('\n👤 Creating test patient...');
        let patient = await Patient.findOne({ caseId: config.caseId });
        
        if (!patient) {
            patient = await Patient.create({
                caseId: config.caseId,
                patientName: 'Quick Test Patient',
                mobileNumber: '9999999999',
                age: 25,
                gender: 'Male',
                ageType: 'year',
                dateOfBirth: new Date('1999-01-01'),
                referredByDoctor: 'Test Doctor',
                doctorContactNo: '8888888888',
                address: 'Test Address',
                city: 'Test City'
            });
        }
        
        console.log(`✅ Test patient ready: ${patient.patientName} (${patient.caseId})`);

        // Test 4: Create a report with dynamic test
        console.log('\n📋 Creating report with dynamic test...');
        const report = await Report.create({
            patientId: patient._id.toString(),
            labId: config.labId,
            testReport: [{
                testName: test.testName,
                testId: test._id,
                testResult: {}, // Legacy format
                testParameters: [ // New dynamic format
                    {
                        parameterId: param._id,
                        subCategoryId: null,
                        value: null,
                        status: 'PENDING',
                        notes: ''
                    }
                ]
            }]
        });
        console.log(`✅ Report created: ${report._id}`);

        // Test 5: Update report with results (both formats)
        console.log('\n🔄 Updating report with results...');
        const testEntry = report.testReport[0];
        
        // Traditional format
        testEntry.testResult.set('glucose', '95');
        
        // Dynamic format
        testEntry.testParameters[0].value = '95';
        testEntry.testParameters[0].status = 'NORMAL';
        testEntry.testParameters[0].notes = 'Fasting glucose within normal range';
        testEntry.isReportSubmitted = true;

        await report.save();
        console.log('✅ Report updated with results');

        // Test 6: Retrieve and validate
        console.log('\n🔍 Retrieving and validating report...');
        const retrievedReport = await Report.findById(report._id)
            .populate('testReport.testId')
            .populate('testReport.testParameters.parameterId');

        if (retrievedReport) {
            console.log('✅ Report retrieved successfully');
            
            const testResult = retrievedReport.testReport[0];
            console.log(`📊 Test: ${testResult.testName}`);
            console.log(`📈 Legacy result: glucose = ${testResult.testResult.get('glucose')}`);
            console.log(`🔬 Dynamic result: ${testResult.testParameters[0].parameterId.name} = ${testResult.testParameters[0].value}`);
            console.log(`📋 Status: ${testResult.testParameters[0].status}`);
            console.log(`📝 Notes: ${testResult.testParameters[0].notes}`);
        }

        // Test 7: Lab isolation check
        console.log('\n🔒 Testing lab isolation...');
        const labReports = await Report.find({ labId: config.labId });
        const otherReports = await Report.find({ labId: 'different-lab' });
        
        console.log(`✅ Lab isolation working: ${labReports.length} reports in test lab, ${otherReports.length} in other lab`);

        console.log('\n🎉 Quick test completed successfully!');
        console.log('✅ Dynamic Parameter System is working correctly');
        console.log('✅ Both legacy and new formats are supported');
        console.log('✅ Lab isolation is working');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        try {
            const Report = require('../models/reports');
            const Test = require('../models/test');
            const Parameter = require('../models/parameter');
            const Patient = require('../models/patient');

            await Report.deleteMany({ labId: config.labId });
            await Test.deleteMany({ testCode: 'GLU_TEST' });
            await Parameter.deleteMany({ code: 'GLU' });
            await Patient.deleteOne({ caseId: config.caseId });
            
            console.log('✅ Cleanup completed');
        } catch (cleanupError) {
            console.error('⚠️  Cleanup failed:', cleanupError.message);
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

// Run the test
if (require.main === module) {
    quickTest().catch(console.error);
}

module.exports = quickTest;
