const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const ResourceRequest = require('../models/ResourceRequest');

// @route   GET /api/resources
// @desc    Get all resources
router.get('/', async (req, res) => {
    try {
        const resources = await Resource.find().sort({ uploadDate: -1 });
        res.json(resources);
    } catch (err) {
        console.error("Error fetching resources:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/resources
// @desc    Add a new resource
router.post('/', async (req, res) => {
    try {
        const newResource = new Resource(req.body);
        const savedResource = await newResource.save();
        res.status(201).json(savedResource);
    } catch (err) {
        console.error("Error adding resource:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/resources/:id
// @desc    Update a resource
router.put('/:id', async (req, res) => {
    try {
        const updatedResource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedResource);
    } catch (err) {
        console.error("Error updating resource:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
router.delete('/:id', async (req, res) => {
    try {
        await Resource.findByIdAndDelete(req.params.id);
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        console.error("Error deleting resource:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/resources/stacks
// @desc    Get all unique stacks with resource counts
router.get('/stacks', async (req, res) => {
    try {
        const stacks = await Resource.aggregate([
            { $group: { _id: '$stack', count: { $sum: 1 } } },
            { $project: { name: '$_id', resourceCount: '$count', _id: 0 } }
        ]);
        res.json(stacks);
    } catch (err) {
        console.error("Error fetching stacks:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/resources/requests
// @desc    Get all resource requests with student details
router.get('/requests', async (req, res) => {
    try {
        const { userRegisterNumber } = req.query;
        let match = {};
        if (userRegisterNumber) {
            match.userRegisterNumber = userRegisterNumber;
        }

        const requests = await ResourceRequest.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userRegisterNumber',
                    foreignField: 'registerNumber',
                    as: 'student'
                }
            },
            { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    topic: 1,
                    stack: 1,
                    description: 1,
                    note: 1,
                    status: 1,
                    date: 1,
                    userRegisterNumber: 1,
                    studentName: '$student.name',
                    department: '$student.department',
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            { $sort: { date: -1 } }
        ]);
        res.json(requests);
    } catch (err) {
        console.error("Error fetching resource requests:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/resources/requests
// @desc    Submit a new resource request
router.post('/requests', async (req, res) => {
    try {
        const newRequest = new ResourceRequest(req.body);
        const savedRequest = await newRequest.save();
        res.status(201).json(savedRequest);
    } catch (err) {
        console.error("Error saving resource request:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH /api/resources/requests/:id
// @desc    Update request status
router.patch('/requests/:id', async (req, res) => {
    try {
        const updatedRequest = await ResourceRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedRequest);
    } catch (err) {
        console.error("Error updating request:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/resources/stats
// @desc    Get resource stats
router.get('/stats', async (req, res) => {
    try {
        const totalResources = await Resource.countDocuments();
        const totalStacks = (await Resource.distinct('stack')).length;
        const pendingRequests = await ResourceRequest.countDocuments({ status: 'Pending' });

        // Find top stack
        const topStackResult = await Resource.aggregate([
            { $group: { _id: '$stack', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);
        const topStack = topStackResult.length > 0 ? topStackResult[0]._id : 'N/A';

        res.json({
            totalResources,
            totalStacks,
            pendingRequests,
            topStack
        });
    } catch (err) {
        console.error("Error fetching resource stats:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/resources/analytics
// @desc    Get detailed resource analytics
router.get('/analytics', async (req, res) => {
    try {
        // 1. Popular Resources (sorted by views or downloads, mock views if don't exist)
        // Note: Assuming 'views' field might exist. If not, default sort by date for now.
        const popularResources = await Resource.find()
            .sort({ views: -1, uploadDate: -1 })
            .limit(5)
            .select('title views downloads stack type');

        // 2. Most Requested Stacks
        // Aggregate from ResourceRequest
        const requestedStacks = await ResourceRequest.aggregate([
            { $group: { _id: '$stack', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { stack: '$_id', count: 1, _id: 0 } }
        ]);

        // 3. Resource Type Distribution
        const totalResources = await Resource.countDocuments();
        const typeDistributionRaw = await Resource.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $project: { type: '$_id', count: 1, _id: 0 } }
        ]);

        const typeDistribution = typeDistributionRaw.map(td => ({
            type: td.type,
            percentage: totalResources > 0 ? Math.round((td.count / totalResources) * 100) : 0
        }));

        res.json({
            popularResources: popularResources.map(pr => ({
                title: pr.title,
                views: pr.views || 0,
                downloads: pr.downloads || 0
            })),
            requestedStacks,
            typeDistribution
        });

    } catch (err) {
        console.error("Error fetching analytics:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
