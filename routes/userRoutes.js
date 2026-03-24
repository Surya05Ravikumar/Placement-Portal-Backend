const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Application = require('../models/Application');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get all users (if needed for admin)
router.get('/', async (req, res) => {
    try {
        const { batch } = req.query;
        let query = {};
        if (batch && batch !== 'overall') {
            const passYear = parseInt(batch, 10);
            const startYear = passYear - 4;
            query.year = { 
                $in: [
                    String(batch),
                    `${startYear}-${String(batch).slice(-2)}`,
                    `${startYear}-${batch}`
                ]
            };
        }

        const users = await User.find(query).lean();
        // Normalize fields for the frontend
        const normalizedUsers = users.map(user => ({
            ...user,
            department: user.department || user.dept || 'N/A',
            year: user.year || user.batch || user.passingYear || 'N/A',
            cgpa: user.cgpa ? Number(user.cgpa).toFixed(1) : (user.gpa ? Number(user.gpa).toFixed(1) : '0.0'),
            phone: user.phone || user.mobile || 'N/A',
            mobile: user.mobile || user.phone || 'N/A'
        }));
        res.json(normalizedUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user profile by email — uses QUERY PARAM (?email=) to avoid Express truncating
// dots in email addresses when used as path params (e.g. user@gmail.com → user@gmail)
// IMPORTANT: Must be defined before /:id
router.get('/byEmail', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ message: 'Email query param is required' });
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        const shortlistedCount = await Application.countDocuments({ 
            userRegisterNumber: { $regex: new RegExp(`^${user.registerNumber}$`, 'i') }, 
            status: { $in: ['Shortlisted', 'Selected'] } 
        });
        const selectedCount = await Application.countDocuments({ 
            userRegisterNumber: { $regex: new RegExp(`^${user.registerNumber}$`, 'i') }, 
            status: 'Selected' 
        });
        const appliedCount = await Application.countDocuments({ 
            userRegisterNumber: { $regex: new RegExp(`^${user.registerNumber}$`, 'i') } 
        });

        // Calculate dynamic rank based on activity points
        const userPoints = user.activityPoints?.total || 0;
        const higherPointUsers = await User.countDocuments({
            'activityPoints.total': { $gt: userPoints }
        });
        const dynamicRank = higherPointUsers + 1;

        const normalized = {
            ...user,
            department: user.department || user.dept || 'N/A',
            year: user.year || user.batch || user.passingYear || 'N/A',
            cgpa: user.cgpa ? Number(user.cgpa).toFixed(1) : (user.gpa ? Number(user.gpa).toFixed(1) : '0.0'),
            phone: user.phone || user.mobile || 'N/A',
            mobile: user.mobile || user.phone || 'N/A',
            activityPoints: user.activityPoints || { total: 0, max: 150, badgeLevel: 'Bronze' },
            appliedCount,
            shortlistedCount,
            selectedCount,
            rank: dynamicRank
        };
        res.json(normalized);
    } catch (err) {
        console.error('Error in /byEmail:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get user profile by register number (case-insensitive)
// IMPORTANT: This route MUST be defined before /:id to avoid Express intercepting it
router.get('/byReg/:regNo', async (req, res) => {
    try {
        const user = await User.findOne({
            registerNumber: { $regex: new RegExp(`^${req.params.regNo}$`, 'i') }
        }).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        const shortlistedCount = await Application.countDocuments({ 
            userRegisterNumber: { $regex: new RegExp(`^${user.registerNumber}$`, 'i') }, 
            status: { $in: ['Shortlisted', 'Selected'] } 
        });
        const selectedCount = await Application.countDocuments({ 
            userRegisterNumber: { $regex: new RegExp(`^${user.registerNumber}$`, 'i') }, 
            status: 'Selected' 
        });
        const appliedCount = await Application.countDocuments({ 
            userRegisterNumber: { $regex: new RegExp(`^${user.registerNumber}$`, 'i') } 
        });

        // Calculate dynamic rank based on activity points
        const userPoints = user.activityPoints?.total || 0;
        const higherPointUsers = await User.countDocuments({
            'activityPoints.total': { $gt: userPoints }
        });
        const dynamicRank = higherPointUsers + 1;

        // Normalize fields (same as GET / endpoint)
        const normalized = {
            ...user,
            department: user.department || user.dept || 'N/A',
            year: user.year || user.batch || user.passingYear || 'N/A',
            cgpa: user.cgpa ? Number(user.cgpa).toFixed(1) : (user.gpa ? Number(user.gpa).toFixed(1) : '0.0'),
            phone: user.phone || user.mobile || 'N/A',
            mobile: user.mobile || user.phone || 'N/A',
            activityPoints: user.activityPoints || { total: 0, max: 150, badgeLevel: 'Bronze' },
            appliedCount,
            shortlistedCount,
            selectedCount,
            rank: dynamicRank
        };
        res.json(normalized);
    } catch (err) {
        console.error('Error in /byReg:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get a specific user profile
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user settings
router.put('/:regNo/settings', async (req, res) => {
    try {
        const user = await User.findOne({ registerNumber: req.params.regNo });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.settings = { ...user.settings.toObject(), ...req.body };
        await user.save();
        res.json({ message: 'Settings updated successfully', settings: user.settings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login (Updated to record history)
router.post('/login', async (req, res) => {
    try {
        const { email, password, deviceInfo, locationInfo } = req.body;
        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            if (user) {
                user.loginHistory.unshift({
                    device: deviceInfo || 'Unknown',
                    location: locationInfo || 'Unknown',
                    status: 'failed',
                    ip: req.ip
                });
                await user.save();
            }
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        user.loginHistory.unshift({
            device: deviceInfo || 'Unknown',
            location: locationInfo || 'Unknown',
            status: 'success',
            ip: req.ip
        });
        
        // Keep only last 20 entries
        if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(0, 20);
        
        await user.save();
        res.json({ message: 'Logged in successfully', user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Record a login event (for Google Login or other types)
router.post('/:id/login-event', async (req, res) => {
    try {
        const { deviceInfo, locationInfo, status } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.loginHistory.unshift({
            device: deviceInfo || 'Unknown',
            location: locationInfo || 'Unknown',
            status: status || 'success',
            ip: req.ip
        });
        
        if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(0, 20);
        
        await user.save();
        res.json({ message: 'Login event recorded', loginHistory: user.loginHistory });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update password
router.post('/:id/update-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Simple check since we are using plain text passwords for now as per codebase pattern
        if (user.password !== currentPassword) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle 2FA
router.post('/:id/toggle-2fa', async (req, res) => {
    try {
        const { enabled } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { twoFactorEnabled: enabled } },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: '2FA settings updated', twoFactorEnabled: user.twoFactorEnabled });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new certification
router.post('/:regNo/certifications', async (req, res) => {
    try {
        const user = await User.findOne({ registerNumber: req.params.regNo });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.certifications.push(req.body);
        await user.save();
        res.status(201).json({ message: 'Certification added successfully', certifications: user.certifications });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new resume
router.post('/:regNo/resumes', async (req, res) => {
    try {
        const user = await User.findOne({ registerNumber: req.params.regNo });
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.resumes.push({
            ...req.body,
            uploadedDate: new Date()
        });
        await user.save();
        res.status(201).json({ message: 'Resume uploaded successfully', resumes: user.resumes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a resume
router.delete('/:regNo/resumes/:resumeId', async (req, res) => {
    try {
        console.log(`Delete request for regNo: ${req.params.regNo}, resumeId: ${req.params.resumeId}`);
        const user = await User.findOne({ registerNumber: req.params.regNo });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const initialLength = user.resumes.length;
        user.resumes = user.resumes.filter(r => {
            const rid = (r._id || r.id).toString();
            return rid !== req.params.resumeId;
        });

        if (user.resumes.length === initialLength) {
            console.log("No resume matched the provided ID.");
        }

        await user.save();
        res.json({ message: 'Resume deleted successfully', resumes: user.resumes });
    } catch (err) {
        console.error("Error deleting resume:", err);
        res.status(500).json({ message: err.message });
    }
});

// Create a new user (Signup)
router.post('/', async (req, res) => {
    try {
        const b = req.body;
        const user = new User({
            name: b.name,
            email: b.email,
            registerNumber: b.registerNumber,
            password: b.password || '123456',
            role: b.role || 'student',
            mobile: b.mobile || b.phone,
            phone: b.phone || b.mobile,
            department: b.department || b.dept || 'CSE',
            year: b.year || b.batch || b.passingYear || '2024',
            cgpa: b.cgpa ? Number(b.cgpa).toFixed(1) : (b.gpa ? Number(b.gpa).toFixed(1) : '0.0'),
            stream: b.stream || 'B.E',
            gender: b.gender || 'Male',
            dateOfBirth: b.dateOfBirth || b.dob,
            placementStatus: b.placementStatus || 'eligible',
            placedCompany: b.placedCompany || '',
            package: b.package || ''
        });
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update user profile (Self)
router.put('/:id/profile', async (req, res) => {
    try {
        const { fullName, designation, email, phone, department, officeLocation, photo, gender, dateOfBirth, skills } = req.body;
        const updateData = {
            name: fullName,
            designation,
            email,
            phone,
            department,
            officeLocation,
            photo,
            gender,
            dateOfBirth,
            skills
        };
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a user (Admin Only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const b = req.body;
        const updateData = {
            ...b,
            mobile: b.mobile || b.phone,
            phone: b.phone || b.mobile,
            department: b.department || b.dept,
            year: b.year || b.batch || b.passingYear,
            cgpa: b.cgpa ? Number(b.cgpa).toFixed(1) : (b.gpa ? Number(b.gpa).toFixed(1) : undefined),
            placementStatus: b.placementStatus,
            placedCompany: b.placedCompany,
            package: b.package
        };
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a user (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Bulk create users
router.post('/bulk', async (req, res) => {
    try {
        const usersData = Array.isArray(req.body) ? req.body : [req.body];
        const processedUsers = usersData.map(user => ({
            ...user,
            password: user.password || '123456',
            role: user.role || 'student',
            mobile: user.mobile || user.phone,
            phone: user.phone || user.mobile,
            department: user.department || user.dept || 'CSE',
            year: user.year || user.batch || user.passingYear || '2024',
            cgpa: user.cgpa ? Number(user.cgpa).toFixed(1) : (user.gpa ? Number(user.gpa).toFixed(1) : '0.0'),
            stream: user.stream || 'B.E',
            gender: user.gender || 'Male',
            dateOfBirth: user.dateOfBirth || user.dob,
            placementStatus: user.placementStatus || 'eligible',
            placedCompany: user.placedCompany || '',
            package: user.package || ''
        }));
        const users = await User.insertMany(processedUsers);
        res.status(201).json(users);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
