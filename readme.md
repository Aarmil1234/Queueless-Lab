# Queueless Lab API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

(Authentication will be added in future versions)

---

## API Endpoints

## 🧑 Patient Routes

### 1. Create a New Patient

**Endpoint:** `POST /patient`

**Description:** Register a new patient

**Request Body:**

```json
{
  "patientName": "John Doe",
  "gender": "Male",
  "dateOfBirth": "1990-01-01",
  "age": 33,
  "referredByDoctor": "Dr. Smith",
  "doctorContactNo": "1234567890",
  "address": "123 Main St, City",
  "mobileNumber": "9876543210",
  "tests": ["blood_test", "urine_test"]
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {}
}
```

---

### 2. Get All Patients

**Endpoint:** `GET /patient`

**Description:** Get a list of all patients

**Query Parameters:**

* `page` (optional) – default: 1
* `limit` (optional) – default: 10

**Success Response:**

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3,
    "limit": 10
  }
}
```

---

## 🧪 Report Routes

### 1. Add Test Report

**Endpoint:** `POST /report/:patientId`

**Description:** Add a new test report for a patient

**URL Parameters:**

* `patientId` – Patient ID

**Request Body:**

```json
{
  "testName": "urine",
  "testResult": {
    "physical": {
      "color": "Yellow",
      "appearance": "Clear"
    },
    "chemical": {
      "ph": 6.0,
      "protein": "Negative",
      "glucose": "Absent"
    },
    "microscopic": {
      "pus_cells": "0-2 /HPF",
      "rbc": "0-1 /HPF"
    }
  }
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Test result added successfully",
  "data": {}
}
```

---

### 2. Get Patient Reports

**Endpoint:** `GET /report/patient/:patientId`

**Description:** Get all reports for a specific patient

**Success Response:**

```json
{
  "success": true,
  "data": []
}
```

---

### 3. Get Report by ID

**Endpoint:** `GET /report/getSingleReport/:reportId`

**Description:** Get a specific report by its ID

**Success Response:**

```json
{
  "success": true,
  "data": {}
}
```

---

### 4. Get All Reports

**Endpoint:** `GET /report/all`

**Query Parameters:**

* `page` (optional)
* `limit` (optional)

**Success Response:**

```json
{
  "success": true,
  "data": [],
  "pagination": {}
}
```

---

## 🧬 Test Routes

### Get All Available Tests

**Endpoint:** `GET /test`

**Description:** Fetch all available lab tests

**Success Response:**

```json
{
  "success": true,
  "data": [
    {
      "key": "cbc",
      "name": "Complete Blood Count",
      "category": "Blood Test",
      "isActive": true
    }
  ]
}
```

---

## ❌ Error Responses

### 400 – Bad Request

```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 404 – Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 – Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

---

## 🚀 Installation

```bash
git clone <repo-url>
npm install
npm run dev
```

---

## 🧪 Running Tests

(Test scripts will be added later)

---

## 📌 Notes

* Test definitions are managed via Test Master
* Reports are stored dynamically using key-value structure
* Designed for scalable lab & hospital systems
