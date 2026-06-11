const express = require('express');
const cors = require('cors');
const http = require('http');
const db = require('./db/db.js');
require('dotenv').config();

const mainRouter = require('./routes/routes.js');

const app = express();

// === Middlewares ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Routes Placeholder ===
app.use(
  '/uploads',
  express.static('uploads')
);
app.use('/api', mainRouter );
const server = http.createServer(app);

// === Database Connection ===
db().catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// === Server Listener ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
