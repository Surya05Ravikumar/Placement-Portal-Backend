const User = require('../models/User');

// Simple middleware to simulate authentication
// In a real app, this would verify a JWT token
const verifyToken = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const mongoose = require('mongoose');

    // Bypass for hardcoded admin who doesn't exist in DB
    const adminEmail = process.env.ADMIN_EMAIL || 'sr7056720@gmail.com';
    if (userId === 'admin-bypass' || userId === adminEmail) {
        req.user = { role: 'admin', email: adminEmail };
        return next();
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ message: 'Authentication required: Valid ID missing' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin role required' });
    }
};

module.exports = { verifyToken, isAdmin };
