const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const Application = require('../models/Application');

router.get('/overview', async (req, res) => {
    try {
        const { batch } = req.query;
        console.log('Fetching overview for batch:', batch);
        let userQuery = {};
        let companyQuery = {};

        if (batch && batch !== 'overall') {
            const passYear = parseInt(batch, 10);
            const startYear = passYear - 4;
            userQuery.year = { 
                $in: [
                    String(batch),
                    `${startYear}-${String(batch).slice(-2)}`,
                    `${startYear}-${batch}`
                ]
            };
            companyQuery.passingYear = passYear;
        }
        console.log('Queries:', { userQuery, companyQuery });

        const totalStudents = await User.countDocuments(userQuery);
        const placedStudents = await User.countDocuments({ ...userQuery, placementStatus: 'placed' });

        const companiesCount = await Company.countDocuments(companyQuery);

        // Find highest package from companies - looking into jobRoles array
        const allCompanies = await Company.find(companyQuery, 'jobRoles');
        let highestPackage = 0;
        allCompanies.forEach(company => {
            company.jobRoles.forEach(role => {
                const pkg = parseFloat(role.package);
                if (!isNaN(pkg) && pkg > highestPackage) {
                    highestPackage = pkg;
                }
            });
        });

        // Filter applications based on students in that batch
        let applicationQuery = {};
        if (batch && batch !== 'overall') {
            const passYear = parseInt(batch, 10);
            const startYear = passYear - 4;
            const batchUsers = await User.find({ 
                year: { 
                    $in: [
                        String(batch),
                        `${startYear}-${String(batch).slice(-2)}`,
                        `${startYear}-${batch}`
                    ]
                }
            }, '_id');
            const userIds = batchUsers.map(u => u._id);
            applicationQuery.user = { $in: userIds };
        }

        const totalApplications = await Application.countDocuments(applicationQuery);

        // Sample data for charts
        const departmentData = [
            { name: 'CSE', placed: await User.countDocuments({ ...userQuery, department: 'CSE', placementStatus: 'placed' }), total: await User.countDocuments({ ...userQuery, department: 'CSE' }) },
            { name: 'IT', placed: await User.countDocuments({ ...userQuery, department: 'IT', placementStatus: 'placed' }), total: await User.countDocuments({ ...userQuery, department: 'IT' }) },
            { name: 'ECE', placed: await User.countDocuments({ ...userQuery, department: 'ECE', placementStatus: 'placed' }), total: await User.countDocuments({ ...userQuery, department: 'ECE' }) },
            { name: 'EEE', placed: await User.countDocuments({ ...userQuery, department: 'EEE', placementStatus: 'placed' }), total: await User.countDocuments({ ...userQuery, department: 'EEE' }) },
            { name: 'MECH', placed: await User.countDocuments({ ...userQuery, department: 'MECH', placementStatus: 'placed' }), total: await User.countDocuments({ ...userQuery, department: 'MECH' }) }
        ];

        // Dynamic Monthly Data: Last 6 months (current and previous 5)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = [];
        const now = new Date();

        for (let i = -5; i <= 0; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const mIndex = d.getMonth();
            const year = d.getFullYear();
            const label = `${monthNames[mIndex]} ${year}`;

            // Start and end of the month for selection count
            const startOfMonth = new Date(year, mIndex, 1);
            const endOfMonth = new Date(year, mIndex + 1, 0, 23, 59, 59);

            const count = await Application.countDocuments({
                ...applicationQuery,
                status: 'Selected',
                updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
            });

            monthlyData.push({
                month: label,
                placements: count
            });
        }

        // Real Package Data - Better numeric range categorization
        const placedUsers = await User.find({ ...userQuery, placementStatus: 'placed' }, 'package');
        const packageData = [
            { range: '0-3 LPA', count: 0 },
            { range: '3-6 LPA', count: 0 },
            { range: '6-10 LPA', count: 0 },
            { range: '10+ LPA', count: 0 }
        ];

        placedUsers.forEach(u => {
            const pkgStr = String(u.package || '0').replace(/[^0-9.]/g, '');
            const pkg = parseFloat(pkgStr);
            if (isNaN(pkg)) return;

            if (pkg <= 3) packageData[0].count++;
            else if (pkg <= 6) packageData[1].count++;
            else if (pkg <= 10) packageData[2].count++;
            else packageData[3].count++;
        });

        res.json({
            stats: {
                totalStudents,
                placedStudents,
                yetToPlace: totalStudents - placedStudents,
                companiesCount,
                highestPackage: highestPackage + " LPA",
                totalApplications
            },
            departmentData,
            monthlyData,
            packageData
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
