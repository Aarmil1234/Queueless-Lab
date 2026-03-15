# Parameter Subcategory Testing Guide

## Complete Testing Flow

This guide covers the complete flow from creating parameters to testing reference ranges with and without subcategories.

## 1. Create Parameter (Base Parameter)

### Request:
```http
POST /api/parameters
Content-Type: application/json

{
  "code": "RBC",
  "name": "Red Blood Cell Count",
  "category": "CBC",
  "type": "NUMERIC",
  "unit": "million cells/μL",
  "isActive": true
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Parameter created successfully",
  "data": {
    "_id": "69b5c444eefe005ab948085c",
    "code": "RBC",
    "name": "Red Blood Cell Count",
    "category": "CBC",
    "type": "NUMERIC",
    "unit": "million cells/μL",
    "isActive": true,
    "delete": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## 2. Create Parameter Subcategories

### 2.1 Create RBC Count Subcategory
```http
POST /api/parameter-subcategories
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "code": "RBC_COUNT",
  "name": "RBC Count",
  "isActive": true
}
```

### 2.2 Create RDW Subcategory
```http
POST /api/parameter-subcategories
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "code": "RDW",
  "name": "Red Distribution Width",
  "isActive": true
}
```

### 2.3 Create RBC Morphology Subcategory
```http
POST /api/parameter-subcategories
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "code": "RBC_MORPHOLOGY",
  "name": "RBC Morphology",
  "isActive": true
}
```

## 3. Test Reference Ranges WITHOUT Subcategory

### 3.1 Create Reference Range for Parameter (No Subcategory)
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": null,
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": null,
  "minValue": 4.7,
  "maxValue": 6.1,
  "ageType": "year"
}
```

### 3.2 Create Another Range for Female
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": null,
  "gender": "FEMALE",
  "ageFrom": 18,
  "ageTo": null,
  "minValue": 4.2,
  "maxValue": 5.4,
  "ageType": "year"
}
```

## 4. Test Reference Ranges WITH Subcategory

### 4.1 Get Subcategory IDs First
```http
GET /api/parameter-subcategories?parameterId=69b5c444eefe005ab948085c
```

### 4.2 Create Reference Range for RBC_COUNT Subcategory - Male
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": "69b5c531c0a6c337a74ea240",
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": 60,
  "minValue": 4.7,
  "maxValue": 6.1,
  "ageType": "year"
}
```

### 4.3 Create Reference Range for RBC_COUNT Subcategory - Female
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": "69b5c531c0a6c337a74ea240",
  "gender": "FEMALE",
  "ageFrom": 18,
  "ageTo": 60,
  "minValue": 4.2,
  "maxValue": 5.4,
  "ageType": "year"
}
```

### 4.4 Create Reference Range for RDW Subcategory - Male
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": "69b5c531c0a6c337a74ea240",
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": null,
  "minValue": 11.5,
  "maxValue": 15.0,
  "ageType": "year"
}
```

### 4.5 Create Reference Range for RDW Subcategory - Female
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": "69b5c531c0a6c337a74ea240",
  "gender": "FEMALE",
  "ageFrom": 18,
  "ageTo": null,
  "minValue": 11.7,
  "maxValue": 15.3,
  "ageType": "year"
}
```

## 5. Test All GET Endpoints

### 5.1 Get All Parameters
```http
GET /api/parameters
```

### 5.2 Get All Parameter Subcategories
```http
GET /api/parameter-subcategories
```

### 5.3 Get Subcategories by Parameter ID
```http
GET /api/parameter-subcategories/69b5c444eefe005ab948085c
```

### 5.4 Get All Default Parameter Ranges
```http
GET /api/default-parameter-ranges
```

### 5.5 Get Parameter Ranges by Parameter ID
```http
GET /api/default-parameter-ranges/69b5c444eefe005ab948085c
```

### 5.6 Get Subcategories by Parameter Code
```http
GET /api/parameter-subcategories/by-parameter-code/RBC
```

## 6. Test UPDATE Operations

### 6.1 Update Parameter Subcategory
```http
PUT /api/parameter-subcategories/69b5c531c0a6c337a74ea240
Content-Type: application/json

{
  "name": "RBC Count (Updated)",
  "isActive": true
}
```

### 6.2 Update Reference Range
```http
PUT /api/default-parameter-ranges/RANGE_ID
Content-Type: application/json

{
  "minValue": 4.5,
  "maxValue": 6.3
}
```

## 7. Test DELETE Operations

### 7.1 Delete Parameter Subcategory (Soft Delete)
```http
DELETE /api/parameter-subcategories/64f1a2b3c4d5e6f7g8h9i0j4
```

### 7.2 Delete Reference Range (Soft Delete)
```http
DELETE /api/default-parameter-ranges/RANGE_ID
```

## 8. Test Error Scenarios

### 8.1 Try to Create Duplicate Subcategory Code
```http
POST /api/parameter-subcategories
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "code": "RBC_COUNT",
  "name": "Duplicate RBC Count",
  "isActive": true
}
```

### Expected Error:
```json
{
  "success": false,
  "message": "Subcategory with code 'RBC_COUNT' already exists for this parameter"
}
```

### 8.2 Try to Create Range with Invalid Age Range
```http
POST /api/default-parameter-ranges/add
Content-Type: application/json

{
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": null,
  "gender": "MALE",
  "ageFrom": 60,
  "ageTo": 18,
  "minValue": 4.7,
  "maxValue": 6.1
}
```

### Expected Error:
```json
{
  "success": false,
  "message": "ageTo must be greater than ageFrom"
}
```

### 8.3 Try to Delete Subcategory Used by Reference Ranges
```http
DELETE /api/parameter-subcategories/69b5c531c0a6c337a74ea240
```

### Expected Error:
```json
{
  "success": false,
  "message": "Cannot delete subcategory. It is being used by reference ranges."
}
```

## 9. Complete Test Script (cURL Commands)

```bash
# 1. Create Parameter
curl -X POST http://localhost:3000/api/parameters \
  -H "Content-Type: application/json" \
  -d '{
    "code": "RBC",
    "name": "Red Blood Cell Count",
    "category": "CBC",
    "type": "NUMERIC",
    "unit": "million cells/μL",
    "isActive": true
  }'

# 2. Create Subcategories
curl -X POST http://localhost:3000/api/parameter-subcategories \
  -H "Content-Type: application/json" \
  -d '{
    "parameterId": "PARAMETER_ID_HERE",
    "code": "RBC_COUNT",
    "name": "RBC Count",
    "isActive": true
  }'

# 3. Create Reference Range without Subcategory
curl -X POST http://localhost:3000/api/default-parameter-ranges/add \
  -H "Content-Type: application/json" \
  -d '{
    "parameterId": "PARAMETER_ID_HERE",
    "subCategoryId": null,
    "gender": "MALE",
    "ageFrom": 18,
    "ageTo": null,
    "minValue": 4.7,
    "maxValue": 6.1
  }'

# 4. Create Reference Range with Subcategory
curl -X POST http://localhost:3000/api/default-parameter-ranges/add \
  -H "Content-Type: application/json" \
  -d '{
    "parameterId": "PARAMETER_ID_HERE",
    "subCategoryId": "SUBCATEGORY_ID_HERE",
    "gender": "MALE",
    "ageFrom": 18,
    "ageTo": 60,
    "minValue": 4.7,
    "maxValue": 6.1
  }'

# 5. Get all data
curl -X GET http://localhost:3000/api/parameter-subcategories
curl -X GET http://localhost:3000/api/default-parameter-ranges/PARAMETER_ID_HERE
```

## 10. Expected Database Structure

After testing, your database should have:

### Parameters Collection:
```json
{
  "_id": "69b5c444eefe005ab948085c",
  "code": "RBC",
  "name": "Red Blood Cell Count",
  "category": "CBC",
  "type": "NUMERIC",
  "unit": "million cells/μL",
  "isActive": true,
  "delete": false
}
```

### ParameterSubCategories Collection:
```json
{
  "_id": "69b5c531c0a6c337a74ea240",
  "parameterId": "69b5c444eefe005ab948085c",
  "code": "RBC_COUNT",
  "name": "RBC Count",
  "isActive": true,
  "delete": false
}
```

### DefaultParameterRanges Collection:
```json
// Without subcategory
{
  "_id": "RANGE_ID_1",
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": null,
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": null,
  "minValue": 4.7,
  "maxValue": 6.1
}

// With subcategory
{
  "_id": "RANGE_ID_2",
  "parameterId": "69b5c444eefe005ab948085c",
  "subCategoryId": "69b5c531c0a6c337a74ea240",
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": 60,
  "minValue": 4.7,
  "maxValue": 6.1
}
```

## Testing Checklist:

- [ ] Create base parameter
- [ ] Create multiple subcategories for parameter
- [ ] Create reference ranges without subcategory
- [ ] Create reference ranges with subcategories
- [ ] Test GET endpoints for all data
- [ ] Test UPDATE operations
- [ ] Test soft DELETE operations
- [ ] Test validation errors
- [ ] Verify unique constraints work
- [ ] Test cascade delete prevention
