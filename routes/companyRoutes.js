const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Application = require('../models/Application');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { notifyAllStudents } = require('../utils/notificationHelper');

// Get all companies with real-time application counts
router.get('/', async (req, res) => {
    try {
        const { batch } = req.query;
        let matchQuery = {};
        if (batch && batch !== 'overall') {
            matchQuery.passingYear = Number(batch);
        }

        const companies = await Company.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'applications',
                    localField: '_id',
                    foreignField: 'company',
                    as: 'applications'
                }
            },
            {
                $addFields: {
                    applicationsCount: { $size: '$applications' },
                    selectedCount: {
                        $size: {
                            $filter: {
                                input: '$applications',
                                as: 'app',
                                cond: { $eq: ['$$app.status', 'Selected'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    applications: 0
                }
            }
        ]);
        res.json(companies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific company with counts
router.get('/:id', async (req, res) => {
    try {
        const companyId = new mongoose.Types.ObjectId(req.params.id);
        const companies = await Company.aggregate([
            { $match: { _id: companyId } },
            {
                $lookup: {
                    from: 'applications',
                    localField: '_id',
                    foreignField: 'company',
                    as: 'applications'
                }
            },
            {
                $addFields: {
                    applicationsCount: { $size: '$applications' },
                    selectedCount: {
                        $size: {
                            $filter: {
                                input: '$applications',
                                as: 'app',
                                cond: { $eq: ['$$app.status', 'Selected'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    applications: 0
                }
            }
        ]);

        if (companies.length === 0) return res.status(404).json({ message: 'Company not found' });
        res.json(companies[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new company (Admin Only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        console.log(req.body);
        const { fcfsEnabled, maxApplications } = req.body;

        // Loophole Prevention: FCFS and Max Applications
        if (fcfsEnabled && !maxApplications) {
            return res.status(400).json({ message: 'Max applications is required when FCFS is enabled' });
        }

        const company = new Company(req.body);
        const newCompany = await company.save();

        // Notify all students about new company
        const io = req.app.get('socketio');
        await notifyAllStudents(
            io,
            'New Company Alert 🚀',
            `${newCompany.name} has just been added for the ${newCompany.passingYear} batch. Check roles and apply now!`,
            'new_company'
        );

        res.status(201).json(newCompany);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a company (Admin Only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json(company);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a company (Admin Only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const company = await Company.findByIdAndDelete(req.params.id);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        res.json({ message: 'Company deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
