const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Company = require('../models/Company');
const Application = require('../models/Application');

// @route   GET /api/reports/history
// @desc    Get report history
router.get('/history', async (req, res) => {
    try {
        const history = await Report.find().sort({ date: -1 });
        res.json(history);
    } catch (err) {
        console.error("Error fetching report history:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/reports/generate
// @desc    Generate a new report
router.post('/generate', verifyToken, isAdmin, async (req, res) => {
    try {
        const { title, type } = req.body;

        // Fetch current stats for the report
        const totalStudents = await User.countDocuments({ role: 'student' });
        const eligibleStudents = await User.countDocuments({ role: 'student', placementStatus: { $in: ['eligible', 'shortlisted', 'applied', 'placed'] } });
        const placedStudents = await User.countDocuments({ role: 'student', placementStatus: 'placed' });
        const companiesCount = await Company.countDocuments();
        
        const placementRate = eligibleStudents > 0 ? ((placedStudents / eligibleStudents) * 100).toFixed(1) : 0;

        // Package calculations
        const allCompanies = await Company.find({}, 'jobRoles');
        let highestPackage = 0;
        let totalPackage = 0;
        let roleCount = 0;
        
        allCompanies.forEach(company => {
            company.jobRoles.forEach(role => {
                const pkg = parseFloat(role.package);
                if (!isNaN(pkg)) {
                    if (pkg > highestPackage) highestPackage = pkg;
                    totalPackage += pkg;
                    roleCount++;
                }
            });
        });
        const averagePackage = roleCount > 0 ? (totalPackage / roleCount).toFixed(2) : 0;

        // Company-wise stats
        // Aggregate on Application model
        const companyStats = await Application.aggregate([
            { $match: { status: 'Selected' } },
            { $group: {
                _id: { companyName: "$companyName", role: "$role" },
                selected: { $sum: 1 }
            }},
            { $sort: { selected: -1 } }
        ]);
        
        const companyWise = companyStats.map(stat => ({
            company: stat._id.companyName || 'Unknown',
            role: stat._id.role || 'Unknown',
            selected: stat.selected
        }));

        // Department-wise stats
        const deptTotalStats = await User.aggregate([
            { $match: { role: 'student' } },
            { $group: { _id: "$department", total: { $sum: 1 } } }
        ]);
        const deptPlacedStats = await User.aggregate([
            { $match: { role: 'student', placementStatus: 'placed' } },
            { $group: { _id: "$department", placed: { $sum: 1 } } }
        ]);

        const departmentWise = deptTotalStats.map(dept => {
            const placedStat = deptPlacedStats.find(p => p._id === dept._id);
            const placed = placedStat ? placedStat.placed : 0;
            return {
                department: dept._id || 'Unknown',
                total: dept.total,
                placed: placed
            };
        });

        const newReport = new Report({
            title,
            type,
            stats: {
                totalStudents,
                eligibleStudents,
                placedStudents,
                placementRate,
                companiesCount,
                highestPackage: highestPackage > 0 ? highestPackage + " LPA" : "0 LPA",
                averagePackage: averagePackage > 0 ? averagePackage + " LPA" : "0 LPA",
                companyWise,
                departmentWise
            }
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error("Error generating report:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/reports/:id
// @desc    Delete a report from history
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: 'Report deleted' });
    } catch (err) {
        console.error("Error deleting report:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
