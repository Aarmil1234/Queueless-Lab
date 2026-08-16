# Test Commands for Parameter Range API

## Prerequisites
1. Make sure your server is running on `http://localhost:3000`
2. Get your auth token first

## Step 1: Get Auth Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"labMobileNumber": "+0987654321"}'
```

## Step 2: Get Parameters
```bash
curl -X GET http://localhost:3000/api/parameter \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 3: Get SubCategories for a Parameter
```bash
curl -X GET http://localhost:3000/api/parameter/subCategory/PARAMETER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 4: Test the NEW Route - Get Ranges by Parameter AND SubCategory
```bash
curl -X GET "http://localhost:3000/api/parameter/defaultParameter/PARAMETER_ID_HERE/subcategory/SUBCATEGORY_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 5: Compare with Existing Route - Get All Ranges for Parameter
```bash
curl -X GET http://localhost:3000/api/parameter/defaultParameter/PARAMETER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 6: Add a Test Parameter Range (if needed)
```bash
curl -X POST http://localhost:3000/api/parameter/defaultParameter/add \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "parameterId": "PARAMETER_ID_HERE",
    "subCategoryId": "SUBCATEGORY_ID_HERE", 
    "gender": "MALE",
    "ageFrom": 18,
    "ageTo": 65,
    "ageType": "year",
    "minValue": 13.5,
    "maxValue": 17.5,
    "isActive": true
  }'
```

## Expected Results

### New Route Success Response:
```json
[
  {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "parameterId": "64f8a1b2c3d4e5f6a7b8c9d1",
    "subCategoryId": "64f8a1b2c3d4e5f6a7b8c9d2",
    "gender": "MALE",
    "ageFrom": 18,
    "ageTo": 65,
    "minValue": 13.5,
    "maxValue": 17.5,
    "isActive": true
  }
]
```

### Error Response (if no ranges found):
```json
"No parameter ranges found for this parameter and subcategory"
```

## Test Checklist
- [ ] Server is running
- [ ] Auth token is valid
- [ ] Parameter ID exists
- [ ] SubCategory ID exists
- [ ] New route returns 200 status
- [ ] Response contains expected data
- [ ] Route filters correctly by both parameter and subcategory

## Quick Test Script
Replace the placeholders and run:
```bash
# Set your variables
TOKEN="your_token_here"
PARAM_ID="your_parameter_id_here"
SUB_ID="your_subcategory_id_here"

# Test the new route
echo "Testing new route..."
curl -X GET "http://localhost:3000/api/parameter/defaultParameter/$PARAM_ID/subcategory/$SUB_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\nComparing with existing route..."
curl -X GET "http://localhost:3000/api/parameter/defaultParameter/$PARAM_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```
