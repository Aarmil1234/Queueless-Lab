// db.js
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

async function connectToMongo() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB!');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
        process.exit(1); // Exit process with failure if unable to connect
    }
}

module.exports = connectToMongo;