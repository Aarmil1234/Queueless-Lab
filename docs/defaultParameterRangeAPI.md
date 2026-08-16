# Default Parameter Range API Documentation

## Base URL
`/api/parameter/defaultParameter`

This is the actual base URL based on the route configuration:
- Main app: `app.use('/api/parameter', parameterRoutes)`
- Parameter routes: `router.use('/defaultParameter', defaultRangeRoutes)`

## Available Endpoints

### 1. Get All Parameter Ranges by Parameter ID
**GET** `/:parameterId`

- **Description**: Retrieves all parameter ranges for a specific parameter
- **Parameters**: 
  - `parameterId` (path): ID of the parameter
- **Example**: `GET /api/parameter/defaultParameter/123`

### 2. Get Parameter Ranges by Parameter and Subcategory
**GET** `/:parameterId/subcategory/:subCategoryId`

- **Description**: Retrieves all parameter ranges for a specific parameter and subcategory combination
- **Parameters**:
  - `parameterId` (path): ID of the parameter
  - `subCategoryId` (path): ID of the subcategory
- **Example**: `GET /api/parameter/defaultParameter/123/subcategory/456`

### 3. Get Specific Parameter Range
**GET** `/:parameterId/subcategory/:subCategoryId/:parameterRangeId`

- **Description**: Retrieves a specific parameter range using parameter, subcategory, and range ID
- **Parameters**:
  - `parameterId` (path): ID of the parameter
  - `subCategoryId` (path): ID of the subcategory
  - `parameterRangeId` (path): ID of the specific parameter range
- **Example**: `GET /api/parameter/defaultParameter/123/subcategory/456/789`

### 4. Get Single Parameter Range by ID
**GET** `/:parameterId/:parameterRangeId`

- **Description**: Retrieves a single parameter range by its ID (alternative method)
- **Parameters**:
  - `parameterId` (path): ID of the parameter
  - `parameterRangeId` (path): ID of the parameter range
- **Example**: `GET /api/parameter/defaultParameter/123/789`

### 5. Add New Parameter Range
**POST** `/add`

- **Description**: Creates a new parameter range
- **Body**: JSON object with parameter range data
- **Example**: `POST /api/parameter/defaultParameter/add`

### 6. Update Parameter Range
**PUT** `/:parameterRangeId`

- **Description**: Updates an existing parameter range
- **Parameters**:
  - `parameterRangeId` (path): ID of the parameter range to update
- **Body**: JSON object with updated parameter range data
- **Example**: `PUT /api/parameter/defaultParameter/789`

### 7. Delete Parameter Range
**DELETE** `/:parameterRangeId`

- **Description**: Soft deletes a parameter range (marks as deleted)
- **Parameters**:
  - `parameterRangeId` (path): ID of the parameter range to delete
- **Example**: `DELETE /api/parameter/defaultParameter/789`

## Usage Guidelines

### For Most Common Use Cases:
1. **Get all ranges for a parameter**: Use `/:parameterId`
2. **Get ranges for parameter + subcategory**: Use `/:parameterId/subcategory/:subCategoryId`
3. **Get a specific range**: Use `/:parameterId/subcategory/:subCategoryId/:parameterRangeId`

### Route Priority:
The routes are checked in order. More specific routes (with more path segments) are matched before general ones.

### Response Format:
All endpoints return JSON with the following structure:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": [...] // Array of parameter ranges or single object
}
```

### Error Codes:
- `200`: Success
- `404`: Not found
- `500`: Internal server error

## Example Frontend Usage

```javascript
const BASE_URL = '/api/parameter/defaultParameter';

// Get all ranges for parameter 123
const getAllRanges = async (parameterId) => {
  const response = await fetch(`${BASE_URL}/${parameterId}`);
  return response.json();
};

// Get ranges for parameter 123 and subcategory 456
const getSubcategoryRanges = async (parameterId, subCategoryId) => {
  const response = await fetch(`${BASE_URL}/${parameterId}/subcategory/${subCategoryId}`);
  return response.json();
};

// Get specific range 789 for parameter 123 and subcategory 456
const getSpecificRange = async (parameterId, subCategoryId, rangeId) => {
  const response = await fetch(`${BASE_URL}/${parameterId}/subcategory/${subCategoryId}/${rangeId}`);
  return response.json();
};

// Add new parameter range
const addParameterRange = async (rangeData) => {
  const response = await fetch(`${BASE_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rangeData),
  });
  return response.json();
};

// Update parameter range 789
const updateParameterRange = async (rangeId, rangeData) => {
  const response = await fetch(`${BASE_URL}/${rangeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rangeData),
  });
  return response.json();
};

// Delete parameter range 789
const deleteParameterRange = async (rangeId) => {
  const response = await fetch(`${BASE_URL}/${rangeId}`, {
    method: 'DELETE',
  });
  return response.json();
};
```
