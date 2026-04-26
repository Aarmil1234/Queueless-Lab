# Complete API Flow for Lab Report System

This document provides the complete flow from lab signup to report creation with all necessary routes and request bodies for Postman testing.

## 📋 Prerequisites

- **Base URL**: `http://localhost:3000/api` (adjust if your server runs on different port)
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (after login)

---

## 🚀 Complete Flow Overview

```
1. Lab Signup → 2. Lab Login → 3. Add Parameters → 4. Add SubCategories → 5. Create Tests → 6. Create Reports → 7. Add Report Results
```

---

## 1️⃣ Lab Signup

**Route**: `POST /api/lab/signup`

**Request Body**:
```json
{
  "labName": "City Diagnostic Center",
  "email": "city@diagnostic.com",
  "password": "securePassword123",
  "phone": "+1234567890",
  "address": "123 Main Street, City",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "licenseNumber": "LAB-123456",
  "registrationNumber": "REG-789012"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Lab registered successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "labName": "City Diagnostic Center",
    "email": "city@diagnostic.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 2️⃣ Lab Login

**Route**: `POST /api/lab/login`

**Request Body**:
```json
{
  "email": "city@diagnostic.com",
  "password": "securePassword123"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "lab": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "labName": "City Diagnostic Center",
      "email": "city@diagnostic.com"
    }
  }
}
```

**🔑 Important**: Copy the `token` from this response - you'll need it for all subsequent requests as Bearer Token.

---

## 3️⃣ Add Parameters

**Route**: `POST /api/parameter/create`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body** (Multiple Parameters):
```json
{
  "parameters": [
    {
      "code": "HB",
      "name": "Hemoglobin",
      "category": "CBC",
      "type": "NUMERIC",
      "unit": "g/dL",
      "isActive": true
    },
    {
      "code": "WBC",
      "name": "White Blood Cells",
      "category": "CBC",
      "type": "NUMERIC",
      "unit": "cells/μL",
      "isActive": true
    },
    {
      "code": "RBC",
      "name": "Red Blood Cells",
      "category": "CBC",
      "type": "NUMERIC",
      "unit": "million cells/μL",
      "isActive": true
    },
    {
      "code": "PLATELETS",
      "name": "Platelets",
      "category": "CBC",
      "type": "NUMERIC",
      "unit": "thousands/μL",
      "isActive": true
    },
    {
      "code": "GLU",
      "name": "Glucose",
      "category": "Biochemistry",
      "type": "NUMERIC",
      "unit": "mg/dL",
      "isActive": true
    }
  ]
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Parameters created successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "code": "HB",
      "name": "Hemoglobin",
      "category": "CBC",
      "type": "NUMERIC",
      "unit": "g/dL"
    }
    // ... other parameters
  ]
}
```

---

## 4️⃣ Add Parameter SubCategories

**Route**: `POST /api/parameterSubCategory/create`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
  "code": "HB_MALE",
  "name": "Hemoglobin Male Range"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Parameter subcategory created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "code": "HB_MALE",
    "name": "Hemoglobin Male Range",
    "isActive": true
  }
}
```

---

## 5️⃣ Create Tests

**Route**: `POST /api/test/create`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "testName": "Complete Blood Count",
  "testCode": "CBC_FULL",
  "category": "Hematology",
  "parameters": [
    "64f8a1b2c3d4e5f6a7b8c9d1",
    "64f8a1b2c3d4e5f6a7b8c9d2",
    "64f8a1b2c3d4e5f6a7b8c9d3",
    "64f8a1b2c3d4e5f6a7b8c9d4"
  ]
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Test created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "testName": "Complete Blood Count",
    "testCode": "CBC_FULL",
    "category": "Hematology",
    "parameters": [
      "64f8a1b2c3d4e5f6a7b8c9d1",
      "64f8a1b2c3d4e5f6a7b8c9d2"
    ],
    "isActive": true
  }
}
```

---

## 6️⃣ Add Patient (First Time)

**Route**: `POST /api/patient/create`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "caseId": "PAT-2024-001",
  "patientName": "John Doe",
  "gender": "Male",
  "dateOfBirth": "1990-05-15",
  "age": 34,
  "ageType": "year",
  "referredByDoctor": "Dr. Smith",
  "doctorContactNo": "+1234567890",
  "mobileNumber": "+0987654321",
  "address": "456 Oak Avenue",
  "city": "New York"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d6",
    "caseId": "PAT-2024-001",
    "patientName": "John Doe",
    "gender": "Male",
    "age": 34
  }
}
```

---

## 7️⃣ Create Report

**Route**: `POST /api/report/create`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "patientId": "64f8a1b2c3d4e5f6a7b8c9d6",
  "labId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "tests": [
    {
      "testName": "Complete Blood Count",
      "testId": "64f8a1b2c3d4e5f6a7b8c9d5"
    }
  ]
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
    "patientId": "64f8a1b2c3d4e5f6a7b8c9d6",
    "labId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "testReport": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d8",
        "testName": "Complete Blood Count",
        "testId": "64f8a1b2c3d4e5f6a7b8c9d5",
        "isReportSubmitted": false,
        "testResult": {},
        "testParameters": [
          {
            "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
            "subCategoryId": null,
            "value": null,
            "status": "PENDING",
            "notes": ""
          }
        ]
      }
    ]
  }
}
```

---

## 8️⃣ Add Report Results

You have two options for adding results:

### Option A: Traditional Format (Backward Compatible)

**Route**: `POST /api/report/add`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "reportId": "64f8a1b2c3d4e5f6a7b8c9d7",
  "testId": "64f8a1b2c3d4e5f6a7b8c9d8",
  "labId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "testResult": {
    "hemoglobin": "14.5",
    "wbc": "7500",
    "rbc": "4.8",
    "platelets": "250"
  }
}
```

### Option B: New Dynamic Format (Recommended)

**Route**: `POST /api/report/add`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "reportId": "64f8a1b2c3d4e5f6a7b8c9d7",
  "testId": "64f8a1b2c3d4e5f6a7b8c9d8",
  "labId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "testParameters": [
    {
      "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
      "subCategoryId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "value": "14.5",
      "status": "NORMAL",
      "notes": "Within normal range for adult male"
    },
    {
      "parameterId": "64f8a1b2c3d4e5f6a7b8c9d2",
      "value": "7500",
      "status": "NORMAL",
      "notes": "Normal white blood cell count"
    },
    {
      "parameterId": "64f8a1b2c3d4e5f6a7b8c9d3",
      "value": "4.8",
      "status": "NORMAL",
      "notes": "Normal red blood cell count"
    },
    {
      "parameterId": "64f8a1b2c3d4e5f6a7b8c9d4",
      "value": "250",
      "status": "NORMAL",
      "notes": "Normal platelet count"
    }
  ]
}
```

**Success Response** (for both options):
```json
{
  "success": true,
  "message": "Report updated successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
    "testReport": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d8",
        "isReportSubmitted": true,
        "testResult": {
          "hemoglobin": "14.5",
          "wbc": "7500"
        },
        "testParameters": [
          {
            "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
            "value": "14.5",
            "status": "NORMAL",
            "notes": "Within normal range for adult male"
          }
        ]
      }
    ]
  }
}
```

---

## 🔍 Get Report

**Route**: `GET /api/report/:reportId`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**: None (pass reportId in URL parameter)

**Success Response**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d7",
    "patientId": "64f8a1b2c3d4e5f6a7b8c9d6",
    "labId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "testReport": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d8",
        "testName": "Complete Blood Count",
        "testId": "64f8a1b2c3d4e5f6a7b8c9d5",
        "isReportSubmitted": true,
        "testResult": {
          "hemoglobin": "14.5",
          "wbc": "7500"
        },
        "testParameters": [
          {
            "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
            "value": "14.5",
            "status": "NORMAL",
            "notes": "Within normal range for adult male"
          }
        ],
        "patientDetails": {
          "patientName": "John Doe",
          "mobileNumber": "+0987654321",
          "referredBy": "Dr. Smith"
        }
      }
    ],
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 📚 Additional Useful Routes

### Get All Tests
```
GET /api/test/all
```

### Get Test with Parameters
```
GET /api/test/:testId/parameters
```

### Get All Reports for Lab
```
POST /api/report/getAll
{
  "labId": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

### Get All Parameters
```
GET /api/parameter/all
```

### Get Parameter SubCategories
```
GET /api/parameterSubCategory/parameter/:parameterId
```

---

## 🧪 Postman Collection Setup

1. **Create Environment Variables**:
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: (will be set after login)

2. **Set Authorization**:
   - Type: `Bearer Token`
   - Token: `{{token}}`

3. **Test Script for Login** (to automatically set token):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.token) {
        pm.environment.set("token", response.data.token);
    }
}
```

---

## 🔧 Important Notes

1. **Lab ID**: Always include `labId` in report-related requests for data isolation
2. **Authentication**: All protected routes require Bearer token in Authorization header
3. **ID Format**: All IDs are MongoDB ObjectId strings - copy them exactly from responses
4. **Data Types**: Ensure numeric values are sent as strings in JSON (as shown in examples)
5. **Status Values**: Use `NORMAL`, `ABNORMAL`, `CRITICAL`, or `PENDING` for parameter status

---

## 🚨 Error Handling

Common error responses:
```json
{
  "success": false,
  "message": "Lab not found"
}
```

```json
{
  "success": false,
  "message": "Invalid token"
}
```

```json
{
  "success": false,
  "message": "labId is required"
}
```

---

## 📊 Flow Summary

1. **Signup Lab** → Get lab credentials
2. **Login** → Get authentication token  
3. **Add Parameters** → Define what can be tested
4. **Add SubCategories** → Optional sub-categories for parameters
5. **Create Tests** → Group parameters into test panels
6. **Add Patients** → Register patients
7. **Create Reports** → Generate report instances for patients
8. **Add Results** → Fill in test results (traditional or dynamic format)

This complete flow ensures proper data isolation, validation, and supports both legacy and new dynamic parameter systems!
