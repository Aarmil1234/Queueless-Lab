# Parameter Subcategory API Documentation

## Overview
This API manages parameter subcategories for laboratory test parameters. Each parameter can have multiple subcategories, and each subcategory can have its own reference ranges.

## Architecture
```
Parameter
├── ParameterSubCategory
│        └── DefaultParameterRange
└── DefaultParameterRange (if no subcategory)
```

## API Endpoints

### 1. Create Parameter Subcategory
**POST** `/parameter-subcategories`

#### Request Body:
```json
{
  "parameterId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "code": "RBC_COUNT",
  "name": "RBC Count",
  "isActive": true
}
```

#### Response:
```json
{
  "success": true,
  "message": "Parameter subcategory created successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "parameterId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "code": "RBC",
      "name": "Red Blood Cell Count",
      "category": "CBC"
    },
    "code": "RBC_COUNT",
    "name": "RBC Count",
    "isActive": true,
    "delete": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get All Parameter Subcategories
**GET** `/parameter-subcategories`

#### Query Parameters:
- `parameterId` (optional): Filter by parameter ID
- `isActive` (optional): Filter by active status (true/false)

#### Example Request:
```
GET /parameter-subcategories?parameterId=64f1a2b3c4d5e6f7g8h9i0j1&isActive=true
```

#### Response:
```json
{
  "success": true,
  "message": "Parameter subcategories retrieved successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "parameterId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "code": "RBC",
        "name": "Red Blood Cell Count",
        "category": "CBC"
      },
      "code": "RBC_COUNT",
      "name": "RBC Count",
      "isActive": true,
      "delete": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "parameterId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "code": "RBC",
        "name": "Red Blood Cell Count",
        "category": "CBC"
      },
      "code": "RDW",
      "name": "Red Distribution Width",
      "isActive": true,
      "delete": false,
      "createdAt": "2024-01-15T10:31:00.000Z",
      "updatedAt": "2024-01-15T10:31:00.000Z"
    }
  ],
  "count": 2
}
```

### 3. Get Parameter Subcategory by ID
**GET** `/parameter-subcategories/:id`

#### Example Request:
```
GET /parameter-subcategories/64f1a2b3c4d5e6f7g8h9i0j2
```

#### Response:
```json
{
  "success": true,
  "message": "Parameter subcategory retrieved successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "parameterId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "code": "RBC",
      "name": "Red Blood Cell Count",
      "category": "CBC"
    },
    "code": "RBC_COUNT",
    "name": "RBC Count",
    "isActive": true,
    "delete": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Get Subcategories by Parameter Code
**GET** `/parameter-subcategories/by-parameter-code/:parameterCode`

#### Example Request:
```
GET /parameter-subcategories/by-parameter-code/RBC
```

#### Response:
```json
{
  "success": true,
  "message": "Parameter subcategories retrieved successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "parameterId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "code": "RBC_COUNT",
      "name": "RBC Count",
      "isActive": true,
      "delete": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "parameterId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "code": "RDW",
      "name": "Red Distribution Width",
      "isActive": true,
      "delete": false,
      "createdAt": "2024-01-15T10:31:00.000Z",
      "updatedAt": "2024-01-15T10:31:00.000Z"
    }
  ],
  "count": 2
}
```

### 5. Update Parameter Subcategory
**PUT** `/parameter-subcategories/:id`

#### Request Body:
```json
{
  "name": "RBC Count (Updated)",
  "isActive": false
}
```

#### Response:
```json
{
  "success": true,
  "message": "Parameter subcategory updated successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "parameterId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "code": "RBC",
      "name": "Red Blood Cell Count",
      "category": "CBC"
    },
    "code": "RBC_COUNT",
    "name": "RBC Count (Updated)",
    "isActive": false,
    "delete": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 6. Delete Parameter Subcategory
**DELETE** `/parameter-subcategories/:id`

#### Example Request:
```
DELETE /parameter-subcategories/64f1a2b3c4d5e6f7g8h9i0j2
```

#### Response:
```json
{
  "success": true,
  "message": "Parameter subcategory deleted successfully"
}
```

## Default Parameter Range Examples

### Reference Range without Subcategory:
```json
{
  "parameterId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "subCategoryId": null,
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": null,
  "minValue": 13,
  "maxValue": 17
}
```

### Reference Range with Subcategory:
```json
{
  "parameterId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "subCategoryId": "64f1a2b3c4d5e6f7g8h9i0j2",
  "gender": "MALE",
  "ageFrom": 18,
  "ageTo": 60,
  "minValue": 4.7,
  "maxValue": 6.1
}
```

## Validation Rules

### Parameter Subcategory:
- `parameterId`: Must exist and be active
- `code`: Required, unique per parameter, automatically converted to uppercase
- `name`: Required
- `isActive`: Optional, defaults to true

### Default Parameter Range:
- `parameterId`: Required
- `subCategoryId`: Optional (null for no subcategory)
- `gender`: Required (MALE, FEMALE, BOTH)
- `ageFrom`: Required, must be >= 0
- `ageTo`: Optional, must be > ageFrom if provided
- `minValue`: Required
- `maxValue`: Required, must be >= minValue

## Error Responses

### 400 Bad Request:
```json
{
  "success": false,
  "message": "Subcategory with code 'RBC_COUNT' already exists for this parameter"
}
```

### 404 Not Found:
```json
{
  "success": false,
  "message": "Parameter subcategory not found"
}
```

### 500 Internal Server Error:
```json
{
  "success": false,
  "message": "Failed to create parameter subcategory"
}
```

## Integration Notes

1. **Route Integration**: Add the following to your main app.js or server.js:
```javascript
const parameterSubCategoryRoutes = require('./routes/parameterSubCategoryRoutes');
app.use('/api', parameterSubCategoryRoutes);
```

2. **Database Indexes**: The models include optimized indexes for performance:
   - Unique index on `{ parameterId, code }` for subcategories
   - Separate unique indexes for parameter ranges with/without subcategories

3. **Soft Delete**: Both models use soft delete (`delete: false` flag) instead of hard deletion

4. **Population**: GET endpoints automatically populate parameter details for better response data

5. **Validation**: All validations are handled at both model and service level for data integrity
