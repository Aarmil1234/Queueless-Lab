# Corrected API Flow for Lab Report System

This document provides the **corrected** API flow based on the actual controllers and routes in your codebase.

## 📋 Prerequisites

- **Base URL**: `http://localhost:3000/api` (adjust if your server runs on different port)
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token (after login)

---

## 🚀 Corrected Flow Overview

```
1. Lab Signup → 2. Lab Login → 3. Add Parameters → 4. Add SubCategories → 5. Create Tests → 6. Add Patients → 7. Create Reports → 8. Add Report Results
```

---

## 1️⃣ Lab Signup

**Route**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "labName": "City Diagnostic Center",
  "ownerName": "John Smith",
  "mobileNumber": "+1234567890",
  "labMobileNumber": "+0987654321",
  "email": "city@diagnostic.com",
  "password": "securePassword123"
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "labName": "City Diagnostic Center",
      "email": "city@diagnostic.com",
      "ownerName": "John Smith"
    }
  }
}
```

---

## 2️⃣ Lab Login

**Route**: `POST /api/auth/login`

**Request Body**:
```json
{
  "labMobileNumber": "+0987654321"
}
```

**Success Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "labName": "City Diagnostic Center",
      "email": "city@diagnostic.com",
      "ownerName": "John Smith"
    }
  }
}
```

**🔑 Important**: Copy the `token` from this response - you'll need it for all subsequent requests as Bearer Token.

---

## 3️⃣ Add Parameters

**Route**: `POST /api/parameter/add`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body** (Single Parameter):
```json
{
  "code": "HB",
  "name": "Hemoglobin",
  "category": "CBC",
  "type": "NUMERIC",
  "unit": "g/dL",
  "isActive": true
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Parameter created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "code": "HB",
    "name": "Hemoglobin",
    "category": "CBC",
    "type": "NUMERIC",
    "unit": "g/dL",
    "isActive": true
  }
}
```

**Note**: You need to make separate requests for each parameter (HB, WBC, RBC, etc.).

---

## 4️⃣ Add Parameter SubCategories

**Route**: `POST /api/parameter/subCategory/add`

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
  "name": "Hemoglobin Male Range",
  "isActive": true
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
    "64f8a1b2c3d4e5f6a7b8c9d3"
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

## 6️⃣ Add Patient

**Route**: `POST /api/patient`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "patientName": "John Doe",
  "gender": "Male",
  "dateOfBirth": "1990-05-15",
  "age": 34,
  "ageType": "year",
  "referredByDoctor": "Dr. Smith",
  "doctorContactNo": "+1234567890",
  "address": "456 Oak Avenue",
  "city": "New York",
  "mobileNumber": "+0987654321",
  "tests": [
    "Complete Blood Count"
  ]
}
```

**Success Response**:
```json
{
  "success": true,
  "message": "Patient created successfully"
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

**Route**: `POST /api/report/testWise`

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
    "rbc": "4.8"
  }
}
```

### Option B: New Dynamic Format (Recommended)

**Route**: `POST /api/report/testWise`

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

**Route**: `GET /api/report/getSingleReport/:reportId`

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
        ]
      }
    ],
    "createdAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 📚 Additional Useful Routes

### Get All Parameters
```
GET /api/parameter
```

### Get Parameter SubCategories
```
GET /api/parameter/subCategory/:parameterId
```

### Get All Tests (Legacy)
```
GET /api/test
```

### Get All Patients
```
GET /api/patient/getAllPatient
```

### Get All Reports
```
GET /api/report
```

---

## 🧪 Postman Collection Setup

1. **Import Collection**: Import `postman-collection-corrected.json`
2. **Create Environment**:
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: (will be set after login)

3. **Set Authorization**:
   - Type: `Bearer Token`
   - Token: `{{token}}`

4. **Test Script for Login** (to automatically set token):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.token) {
        pm.environment.set("token", response.data.token);
        pm.environment.set("labId", response.data.user.id);
    }
}
```

---

## 🔧 Important Notes

1. **Lab Login**: Uses `labMobileNumber` instead of email/password
2. **Parameter Creation**: One parameter per request (not array)
3. **Test Creation**: Uses the new dynamic test system
4. **Report Results**: Route is `/report/testWise` (not `/report/add`)
5. **Get Report**: Route is `/report/getSingleReport/:reportId`
6. **Lab ID**: Always include `labId` in report-related requests
7. **Authentication**: All protected routes require Bearer token

---

## 🚨 Error Handling

Common error responses:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "parameterId is required"
}
```

---

## 📊 Corrected Flow Summary

1. **Signup Lab** → Get lab credentials with `labMobileNumber`
2. **Login** → Get authentication token using `labMobileNumber`
3. **Add Parameters** → One parameter per request using `/parameter/add`
4. **Add SubCategories** → Use `/parameter/subCategory/add`
5. **Create Tests** → Use `/test/create` with parameter references
6. **Add Patients** → Use `/patient` with test array
7. **Create Reports** → Use `/report/create`
8. **Add Results** → Use `/report/testWise` (not `/report/add`)

This corrected flow matches your actual controller implementations and route structure!
