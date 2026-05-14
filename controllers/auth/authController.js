const { sendResponse } = require("../../utils/sendResponse");
const LaboratoryOwner = require("../../models/laboratoryOwner");
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function login(req, res) {
    try {
        const { labMobileNumber } = req.body;

        // Validate input
        if (!labMobileNumber) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Mobile number is required'
            });
        }

        // Find user by email
        const owner = await LaboratoryOwner.findOne({ labMobileNumber, isActive: true });
        if (!owner) {
            return sendResponse(req, res, 401, {
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: owner._id, email: owner.email, labId: owner._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Save token for middleware validation and lab-specific access
        owner.token = token;
        await owner.save({ validateBeforeSave: false });

        // Return success response with token
        return sendResponse(req, res, 200, {
            success: true,
            data: {
                token,
                user: {
                    id: owner._id,
                    labName: owner.labName,
                    email: owner.email,
                    ownerName: owner.ownerName
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
}

async function signup(req, res) {
    try {
        const { labName, ownerName, mobileNumber, labMobileNumber, email, password } = req.body;

        // Check if user already exists
        const existingUser = await LaboratoryOwner.findOne({
            $or: [{ email }, { mobileNumber }]
        });

        if (existingUser) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'User with this email or mobile number already exists'
            });
        }

        // Create new laboratory owner
        const newOwner = new LaboratoryOwner({
            labName,
            ownerName,
            mobileNumber,
            labMobileNumber,
            email,
            password // Password will be hashed by the pre-save hook
        });

        await newOwner.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newOwner._id, email: newOwner.email, labId: newOwner._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        newOwner.token = token;
        await newOwner.save({ validateBeforeSave: false });

        // Return success response with token
        return sendResponse(req, res, 201, {
            success: true,
            message: 'Registration successful',
            data: {
                token,
                user: {
                    id: newOwner._id,
                    labName: newOwner.labName,
                    email: newOwner.email,
                    ownerName: newOwner.ownerName
                }
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Error during registration',
            error: error.message
        });
    }
}

module.exports = {
    login,
    signup
};