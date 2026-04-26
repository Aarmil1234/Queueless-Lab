# Dynamic Parameter System for Reports

This document explains the new dynamic parameter system that makes report creation more flexible and structured.

## Overview

The system now supports:
- **Dynamic Test Definitions**: Tests can be defined with specific parameters
- **Parameter SubCategories**: Parameters can have sub-categories for more detailed reporting
- **Structured Results**: Test results can be stored with proper parameter references
- **Backward Compatibility**: Existing `testResult` structure still works

## New Models

### Test Model
```javascript
{
  testName: String,
  testCode: String,
  category: String,
  parameters: [ObjectId], // References to Parameter model
  isActive: Boolean,
  delete: Boolean
}
```

### Enhanced Report Model
```javascript
{
  patientId: String,
  labId: String,
  testReport: [{
    testName: String,
    testId: ObjectId, // New: Reference to Test model
    testResult: Map,  // Backward compatibility
    testParameters: [{ // New: Dynamic parameter structure
      parameterId: ObjectId,
      subCategoryId: ObjectId,
      value: Mixed,
      status: String,
      notes: String
    }]
  }]
}
```

## API Usage

### 1. Create a Test with Parameters
```bash
POST /api/test/create
{
  "testName": "Complete Blood Count",
  "testCode": "CBC_FULL",
  "category": "Hematology",
  "parameters": ["param_id_1", "param_id_2", "param_id_3"]
}
```

### 2. Get Test with Parameters and SubCategories
```bash
GET /api/test/:testId/parameters
```

### 3. Create Report with Dynamic Tests
```bash
POST /api/report/create
{
  "patientId": "patient123",
  "labId": "lab456",
  "tests": [
    {
      "testName": "CBC",
      "testId": "test_id_123" // This will auto-populate parameters
    }
  ]
}
```

### 4. Add Report Results (Two Ways)

#### Traditional Way (Backward Compatible)
```bash
POST /api/report/add
{
  "reportId": "report123",
  "testId": "test123",
  "labId": "lab456",
  "testResult": {
    "hemoglobin": "14.5",
    "wbc": "7500"
  }
}
```

#### New Dynamic Way
```bash
POST /api/report/add
{
  "reportId": "report123",
  "testId": "test123",
  "labId": "lab456",
  "testParameters": [
    {
      "parameterId": "param123",
      "subCategoryId": "sub123",
      "value": "14.5",
      "status": "NORMAL",
      "notes": "Within normal range"
    },
    {
      "parameterId": "param124",
      "value": "7500",
      "status": "NORMAL"
    }
  ]
}
```

## Benefits

1. **Structured Data**: Results are linked to specific parameters
2. **Validation**: System validates parameter and subcategory IDs
3. **Flexibility**: Support for both simple and complex test structures
4. **Backward Compatibility**: Existing integrations continue to work
5. **Scalability**: Easy to add new parameters and subcategories

## Migration Guide

### For Existing Reports
- Existing reports continue to work without changes
- `testResult` field is preserved for backward compatibility

### For New Implementations
- Use `testParameters` array for structured data
- Create test definitions first, then reference them in reports
- Use parameter and subcategory IDs for proper data relationships

## Database Relationships

```
Test → Parameters (Many-to-Many)
Parameter → SubCategories (One-to-Many)
Report → TestReport → TestParameters (Nested)
```

This structure ensures data integrity while maintaining flexibility for different types of medical tests.
