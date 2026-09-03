const jwt = require('jsonwebtoken');
const LaboratoryOwner = require('../models/laboratoryOwner');
const laboratoryOwnerSession = require('../models/laboratoryOwnerSession');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// const authMiddleware = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;

//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Token missing'
//             });
//         }

//         const token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, JWT_SECRET);

//         const owner = await LaboratoryOwner.findOne({ _id: decoded.id, token, isActive: true });
//         if (!owner) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Invalid or expired token'
//             });
//         }

//         req.headers.labId = owner._id;
//         req.labId = owner._id;
//         req.labName = owner.labName;
//         req.owner = owner;

//         next();
//     } catch (error) {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid token'
//         });
//     }
// };

const authMiddleware = async (req, res, next) => {
    try {
    const authHeader = req.headers.authorization;

        // Check authorization header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token missing'
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if laboratory owner is active
        const owner = await LaboratoryOwner.findOne({
            _id: decoded.id,
            isActive: true
        });

        if (!owner) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Check if this particular device/session is active
        const session = await laboratoryOwnerSession.findOne({
            ownerId: owner._id,
            token,
            isActive: true
        });

        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }

        // Attach laboratory details to request
        req.headers.labId = owner._id.toString();
        req.labId = owner._id;
        req.labName = owner.labName;
        req.owner = owner;
        req.session = session;

        next();

    } catch (error) {
        console.log("error", error);
        
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

module.exports = authMiddleware;