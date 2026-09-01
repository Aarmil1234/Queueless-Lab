const jwt = require('jsonwebtoken');
const LaboratoryOwner = require('../models/laboratoryOwner');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token missing'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const owner = await LaboratoryOwner.findOne({ _id: decoded.id, token, isActive: true });
        if (!owner) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.headers.labId = owner._id;
        req.labId = owner._id;
        req.labName = owner.labName;
        req.owner = owner;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = authMiddleware;