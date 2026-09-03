const { sendResponse } = require("../../utils/sendResponse");
const LaboratoryOwner = require("../../models/laboratoryOwner");
const { sendOtpSms, verifyOtpDB } = require("../../services/smsService");
const jwt = require('jsonwebtoken');
const LaboratoryOwnerSession = require('../../models/laboratoryOwnerSession');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function login(req, res) {
    try {
    const { labMobileNumber, password } = req.body;

        // Validate mobile number
        if (!labMobileNumber) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Mobile number is required'
            });
        }

        // Validate password
        if (!password) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Password is required'
            });
        }

        // Find laboratory owner
        const owner = await LaboratoryOwner
            .findOne({
                labMobileNumber,
                isActive: true
            })
            .select('+password');

        // Validate user and password
        if (!owner || !(await owner.comparePassword(password))) {
            return sendResponse(req, res, 401, {
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: owner._id,
                email: owner.email,
                labId: owner._id
            },
            JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        // Create a separate session for this login/device
        await LaboratoryOwnerSession.create({
            ownerId: owner._id,
            token,
            deviceInfo: req.headers['user-agent'] || '',
            isActive: true
        });

        // Return success response
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

async function logout(req, res) {
    try {
        await LaboratoryOwnerSession.findByIdAndUpdate(
            req.session._id,
            {
                isActive: false
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

async function signup(req, res) {
    try {
        const { labName, ownerName, mobileNumber, labMobileNumber, email, password } = req.body;

        // Validate input
        if (!password) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Password is required'
            });
        }

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
            { expiresIn: '24h' } // remove if don't want to expire
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

async function forgetPassword(req, res) {
    try {
        const { labMobileNumber } = req.body;

        if (!labMobileNumber) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Mobile number is required'
            });
        }

        const owner = await LaboratoryOwner.findOne({ labMobileNumber, isActive: true });
        if (!owner) {
            return sendResponse(req, res, 404, {
                success: false,
                message: 'No account found with this mobile number'
            });
        }

        await sendOtpSms(owner.labMobileNumber);

        return sendResponse(req, res, 200, {
            success: true,
            message: 'OTP sent successfully to registered mobile number'
        });

    } catch (error) {
        console.error('Forget password error:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Server error while sending OTP',
            error: error.message
        });
    }
}

async function resetPassword(req, res) {
    try {
        const { labMobileNumber, otp, newPassword } = req.body;

        if (!labMobileNumber || !otp || !newPassword) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Mobile number, OTP and new password are required'
            });
        }

        const owner = await LaboratoryOwner.findOne({ labMobileNumber, isActive: true });
        if (!owner) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'No account found with this mobile number'
            });
        }

        const otpResult = await verifyOtpDB(labMobileNumber, otp);
        if (!otpResult.status) {
            return sendResponse(req, res, 400, {
                success: false,
                message: otpResult.message
            });
        }

        owner.password = newPassword;
        await owner.save();

        return sendResponse(req, res, 200, {
            success: true,
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Server error while resetting password',
            error: error.message
        });
    }
}

async function updatePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendResponse(req, res, 400, {
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const owner = await LaboratoryOwner.findById(req.labId).select('+password');
        if (!owner || !(await owner.comparePassword(currentPassword))) {
            return sendResponse(req, res, 401, {
                success: false,
                message: 'Current password is incorrect'
            });
        }

        owner.password = newPassword;
        await owner.save();

        return sendResponse(req, res, 200, {
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Update password error:', error);
        return sendResponse(req, res, 500, {
            success: false,
            message: 'Server error while updating password',
            error: error.message
        });
    }
}

module.exports = {
    login,
    signup,
    forgetPassword,
    resetPassword,
    updatePassword,
    logout
};