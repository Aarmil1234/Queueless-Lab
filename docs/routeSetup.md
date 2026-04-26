# Route Setup Guide

This document shows how to set up the routes for the complete API flow.

## 📁 Required Route Files

Make sure you have the following route files in your project:

### 1. Lab Routes (`routes/lab/labRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { signup, login } = require('../../controllers/lab/labController');

router.post('/signup', signup);
router.post('/login', login);

module.exports = router;
```

### 2. Parameter Routes (`routes/parameter/parameterRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { createParameter, getAllParameters } = require('../../controllers/parameter/parameterController');

router.post('/create', createParameter);
router.get('/all', getAllParameters);

module.exports = router;
```

### 3. Parameter SubCategory Routes (`routes/parameterSubCategory/parameterSubCategoryRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { addParameterSubCategory, getAllParameterSubCategoriesByParameterId } = require('../../controllers/parameterSubCategory/parameterSubCategoryController');

router.post('/create', addParameterSubCategory);
router.get('/parameter/:parameterId', getAllParameterSubCategoriesByParameterId);

module.exports = router;
```

### 4. Test Routes (`routes/test/testRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const {
    getAllTestList,
    createTest,
    getAllTests,
    getTestById,
    getTestParametersWithSubCategories
} = require('../../controllers/test/testController');

// Legacy route - keep for backward compatibility
router.get('/test-list', getAllTestList);

// New dynamic test management routes
router.post('/create', createTest);
router.get('/all', getAllTests);
router.get('/:testId', getTestById);
router.get('/:testId/parameters', getTestParametersWithSubCategories);

module.exports = router;
```

### 5. Patient Routes (`routes/patient/patientRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const { createPatient, getPatientById } = require('../../controllers/patient/patientController');

router.post('/create', createPatient);
router.get('/:patientId', getPatientById);

module.exports = router;
```

### 6. Report Routes (`routes/report/reportRoutes.js`)
```javascript
const express = require('express');
const router = express.Router();
const {
    createNewReport,
    addPatientReport,
    getPatientReport,
    getAllPatientReport,
    getReportById,
    getTestsListReport
} = require('../../controllers/report/reportController');

router.post('/create', createNewReport);
router.post('/add', addPatientReport);
router.get('/patient/:patientId', getPatientReport);
router.post('/getAll', getAllPatientReport);
router.get('/:reportId', getReportById);
router.get('/tests/:patientId/:status', getTestsListReport);

module.exports = router;
```

## 🔗 Main App Route Setup

In your main `app.js` or `server.js`, add these routes:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const labRoutes = require('./routes/lab/labRoutes');
const parameterRoutes = require('./routes/parameter/parameterRoutes');
const parameterSubCategoryRoutes = require('./routes/parameterSubCategory/parameterSubCategoryRoutes');
const testRoutes = require('./routes/test/testRoutes');
const patientRoutes = require('./routes/patient/patientRoutes');
const reportRoutes = require('./routes/report/reportRoutes');

// API routes
app.use('/api/lab', labRoutes);
app.use('/api/parameter', parameterRoutes);
app.use('/api/parameterSubCategory', parameterSubCategoryRoutes);
app.use('/api/test', testRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/report', reportRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

## 🧪 Test the Routes

After setting up the routes, test them:

### 1. Test Server is Running
```bash
curl http://localhost:3000/api
```

### 2. Test Lab Signup
```bash
curl -X POST http://localhost:3000/api/lab/signup \
  -H "Content-Type: application/json" \
  -d '{
    "labName": "Test Lab",
    "email": "test@lab.com",
    "password": "password123"
  }'
```

### 3. Test Lab Login
```bash
curl -X POST http://localhost:3000/api/lab/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lab.com",
    "password": "password123"
  }'
```

## 📋 Complete Route List

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| POST | `/api/lab/signup` | Register new lab | No |
| POST | `/api/lab/login` | Lab login | No |
| POST | `/api/parameter/create` | Add parameters | Yes |
| GET | `/api/parameter/all` | Get all parameters | Yes |
| POST | `/api/parameterSubCategory/create` | Add subcategory | Yes |
| GET | `/api/parameterSubCategory/parameter/:parameterId` | Get subcategories | Yes |
| GET | `/api/test/test-list` | Get legacy test list | No |
| POST | `/api/test/create` | Create test | Yes |
| GET | `/api/test/all` | Get all tests | Yes |
| GET | `/api/test/:testId` | Get test by ID | Yes |
| GET | `/api/test/:testId/parameters` | Get test with parameters | Yes |
| POST | `/api/patient/create` | Add patient | Yes |
| GET | `/api/patient/:patientId` | Get patient by ID | Yes |
| POST | `/api/report/create` | Create report | Yes |
| POST | `/api/report/add` | Add report results | Yes |
| GET | `/api/report/:reportId` | Get report by ID | Yes |
| POST | `/api/report/getAll` | Get all reports for lab | Yes |
| GET | `/api/report/patient/:patientId` | Get patient reports | Yes |

## 🔧 Troubleshooting

### Common Issues:

1. **Route Not Found**: Check if routes are properly registered in `app.js`
2. **CORS Issues**: Make sure `cors()` middleware is used before routes
3. **Body Parser Issues**: Ensure `express.json()` middleware is used
4. **Authentication Errors**: Check that Bearer token is properly formatted
5. **Database Connection**: Ensure MongoDB is running and connected

### Debug Tips:

1. Use `console.log` in controllers to trace request flow
2. Check network tab in browser for detailed error responses
3. Use Postman console for API debugging
4. Verify environment variables are set correctly

## 🚀 Next Steps

1. Set up all route files as shown above
2. Import and register routes in main app file
3. Test each endpoint using Postman collection
4. Verify authentication and authorization work correctly
5. Test the complete flow from signup to report creation

Once all routes are set up, you can use the complete API flow documented in `completeAPIFlow.md`!
