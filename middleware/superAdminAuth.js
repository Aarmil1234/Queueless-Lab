const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/superAdminModel');

const superAdminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token missing'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lab tokens don't carry this role, so they can't reach super admin routes
        if (decoded.role !== 'SUPER_ADMIN' || !decoded.superAdminId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const admin = await SuperAdmin.findOne({
            _id: decoded.superAdminId,
            isActive: true
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Reject tokens issued before the last password change
        if (admin.passwordChangedAt && decoded.iat * 1000 < admin.passwordChangedAt.getTime()) {
            return res.status(401).json({
                success: false,
                message: 'Password changed, please login again'
            });
        }

        req.superAdmin = admin;
        req.superAdminId = admin._id;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = superAdminAuth;
