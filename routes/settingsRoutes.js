const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/settings
// @desc    Get current settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = new Settings({});
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/settings
// @desc    Update settings (Admin Only)
router.put('/', verifyToken, isAdmin, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (err) {
        console.error("Error updating settings:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
