// Creates (or resets the password of) a super admin.
// Usage: node setup/createSuperAdmin.js "<name>" <email> <mobileNumber> <password>
const mongoose = require('mongoose');
require('dotenv').config();
const SuperAdmin = require('../models/superAdminModel');

async function createSuperAdmin() {
    const [name, email, mobileNumber, password] = process.argv.slice(2);

    if (!name || !email || !mobileNumber || !password) {
        console.log('Usage: node setup/createSuperAdmin.js "<name>" <email> <mobileNumber> <password>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let admin = await SuperAdmin.findOne({ email: email.toLowerCase() });
        if (admin) {
            admin.name = name;
            admin.mobileNumber = mobileNumber;
            admin.password = password;
            admin.isActive = true;
        } else {
            admin = new SuperAdmin({ name, email, mobileNumber, password });
        }

        await admin.save(); // Password is hashed by the pre-save hook
        console.log(`Super admin ready: ${admin.email}`);

    } catch (error) {
        console.log(error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

createSuperAdmin();
