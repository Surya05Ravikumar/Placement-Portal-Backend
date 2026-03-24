const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const Company = require('../models/Company');
const Settings = require('../models/Settings');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { notify, notifyAdmins } = require('../utils/notificationHelper');

// Get all applications
router.get('/', async (req, res) => {
    try {
        const applications = await Application.find().sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new application (With all user-requested validations)
router.post('/', async (req, res) => {
    try {
        const { userId, companyId, userRegisterNumber, companyName, additionalInfo, role, package, resume } = req.body;

        // 1. Basic Existence Checks
        const user = await User.findById(userId);
        const company = await Company.findById(companyId);
        const settings = await Settings.findOne();

        if (!user || !company) {
            return res.status(404).json({ message: 'User or Company not found' });
        }

        // 2. Loophole Prevention: Student Status Check
        if (user.placementStatus === 'placed') {
            const currentPackage = parseFloat(user.package) || 0;
            const newPackage = parseFloat(package) || 0;
            
            if (newPackage < 2 * currentPackage) {
                return res.status(400).json({ 
                    message: `You are already placed at ${currentPackage} LPA. You can only apply for companies offering at least ${2 * currentPackage} LPA (2x rule).` 
                });
            }
        }

        // 3. Loophole Prevention: Application Deadline Check
        const today = new Date();
        if (today > new Date(company.applicationDeadline)) {
            return res.status(400).json({ message: 'Application deadline has passed' });
        }

        // 4. Loophole Prevention: Duplicate Application Check
        const existingApp = await Application.findOne({ user: userId, company: companyId });
        if (existingApp) {
            return res.status(400).json({ message: 'You have already applied for this company' });
        }

        // 5. Loophole Prevention: FCFS (Max Applications)
        if (company.maxApplications && company.maxApplications !== Infinity) {
            const currentAppsCount = await Application.countDocuments({ company: companyId });
            if (currentAppsCount >= company.maxApplications) {
                return res.status(400).json({ message: 'Maximum application limit reached for this company' });
            }
        }

        // 6. Loophole Prevention: Eligibility Check (Backend Re-computation)
        if (!settings || !settings.allowIneligible) {
            const isBranchEligible = company.eligibleBranches.includes(user.department);
            const hasEnoughPoints = (user.activityPoints?.total || 0) >= (company.requiredPoints || 0);
            const hasEnoughCGPA = parseFloat(user.cgpa) >= (company.minCGPA || 0);

            if (!isBranchEligible || !hasEnoughPoints || !hasEnoughCGPA) {
                let reason = "You do not meet the eligibility criteria:";
                if (!isBranchEligible) reason += " Incorrect Department.";
                if (!hasEnoughPoints) reason += " Low Activity Points.";
                if (!hasEnoughCGPA) reason += " CGPA below minimum.";
                return res.status(400).json({ message: reason });
            }
        }

        // 7. Save Application
        const application = new Application({
            user: userId,
            company: companyId,
            userRegisterNumber,
            companyName,
            status: 'Applied',
            additionalInfo,
            role,
            package,
            resume
        });

        const newApp = await application.save();

        // Increment user's applicationsCount
        user.applicationsCount = (user.applicationsCount || 0) + 1;
        await user.save();

        // Increment company's applicationsCount
        company.applicationsCount = (company.applicationsCount || 0) + 1;
        await company.save();

        // Notify admins if 100+ applications received
        if (company.applicationsCount === 100) {
            const io = req.app.get('socketio');
            await notifyAdmins(
                io,
                'High Application Volume 📈',
                `${company.name} has received 100+ applications. It's time to start the screening process.`,
                'high_applications'
            );
        }

        res.status(201).json({ message: 'Application submitted successfully', application: newApp });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all applications for a specific user (by register number for ease)
router.get('/user/:regNo', async (req, res) => {
    try {
        const applications = await Application.find({ userRegisterNumber: req.params.regNo }).populate('company');
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all applications for a specific company
router.get('/company/:companyId', async (req, res) => {
    try {
        const applications = await Application.find({ company: req.params.companyId }).populate('user', 'name registerNumber department cgpa email phone');
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get application statistics for a specific company
router.get('/stats/company/:companyId', async (req, res) => {
    try {
        const total = await Application.countDocuments({ company: req.params.companyId });
        const shortlisted = await Application.countDocuments({ company: req.params.companyId, status: 'Shortlisted' });
        const selected = await Application.countDocuments({ company: req.params.companyId, status: 'Selected' });
        const rejected = await Application.countDocuments({ company: req.params.companyId, status: 'Rejected' });
        const inProgress = await Application.countDocuments({ company: req.params.companyId, status: 'In-Progress' });

        res.json({
            total,
            shortlisted,
            selected,
            rejected,
            inProgress
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific application by ID
router.get('/:id', async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        res.json(application);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mock uploading experience (Admin Only)
router.post('/:id/experience', verifyToken, isAdmin, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        application.experienceUploaded = true;
        await application.save();

        res.json({ message: 'Experience uploaded successfully', application });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Helper to validate and enforce sequential round progression
const validateAndAdjustRounds = (application, roundsData, company) => {
    const updatedRounds = { ...roundsData };
    const appData = application.toObject();
    const availableRounds = company?.rounds || [];
    const totalRounds = availableRounds.length || 5;
    
    // Sort round keys to process them in order
    const roundKeys = Object.keys(updatedRounds).filter(k => k.startsWith('round')).sort((a, b) => {
        const numA = parseInt(a.replace('round', ''));
        const numB = parseInt(b.replace('round', ''));
        return numA - numB;
    });

    let hasFailedNow = false;

    for (const key of roundKeys) {
        const roundNum = parseInt(key.replace('round', ''));
        const status = updatedRounds[key];

        // 1. Check if previous rounds are passed
        for (let i = 1; i < roundNum; i++) {
            const prevKey = `round${i}`;
            const prevStatus = updatedRounds[prevKey] !== undefined ? updatedRounds[prevKey] : appData[prevKey];
            
            if (prevStatus !== 'pass') {
                throw new Error(`Cannot update ${key} because previous round (${prevKey}) is not passed.`);
            }
        }

        // 2. If this round is 'fail', all subsequent rounds must be 'n/a'
        if (status === 'fail') {
            hasFailedNow = true;
            for (let i = roundNum + 1; i <= totalRounds; i++) {
                updatedRounds[`round${i}`] = 'n/a';
            }
        }
    }
    
    // 3. Determine final status recommendation
    let finalStatus = application.status;
    let anyFail = false;
    let allPass = true;
    for (let i = 1; i <= totalRounds; i++) {
        const val = updatedRounds[`round${i}`] !== undefined ? updatedRounds[`round${i}`] : appData[`round${i}`];
        if (val === 'fail') anyFail = true;
        if (val !== 'pass') allPass = false;
    }

    if (anyFail) finalStatus = 'Rejected';
    else if (allPass && totalRounds > 0) finalStatus = 'Selected';
    else if (application.status === 'Applied' && !anyFail) finalStatus = 'In-Progress';

    return { updatedRounds, finalStatus };
};

// Update application status (Admin Only)
router.patch('/:id/status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status: requestedStatus, roundsData } = req.body;
        console.log('Update Status Request:', { id: req.params.id, requestedStatus, roundsData });
        const application = await Application.findById(req.params.id).populate('company');

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const oldStatus = application.status;
        let targetStatus = requestedStatus || oldStatus;

        // Apply dynamic round completion mapping if provided
        if (roundsData) {
            try {
                const { updatedRounds, finalStatus } = validateAndAdjustRounds(application, roundsData, application.company);
                targetStatus = finalStatus;
                
                let maxPassedRoundIndex = -1;
                Object.keys(updatedRounds).forEach(key => {
                    application.set(key, updatedRounds[key], { strict: false });
                    application.markModified(key);

                    // Track the highest round number that is 'pass'
                    const roundMatch = key.match(/^round(\d+)$/);
                    if (roundMatch && updatedRounds[key] === 'pass') {
                        const roundIdx = parseInt(roundMatch[1]) - 1;
                        if (roundIdx > maxPassedRoundIndex) maxPassedRoundIndex = roundIdx;
                    }
                });

                // Update currentRound string
                if (maxPassedRoundIndex !== -1 && application.company?.rounds) {
                    const roundName = application.company.rounds[maxPassedRoundIndex]?.name || `Round ${maxPassedRoundIndex + 1}`;
                    application.currentRound = roundName;
                }
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }
        }

        // Final Validation: If status is being set to Selected, verify ALL rounds are passed
        if (targetStatus === 'Selected') {
            const rounds = application.company?.rounds || [];
            const total = rounds.length || 5;
            for (let i = 1; i <= total; i++) {
                const val = application.get(`round${i}`);
                if (val !== 'pass') {
                    return res.status(400).json({ message: `Cannot set status to Selected. Round ${i} is not passed.` });
                }
            }
        }

        application.status = targetStatus;
        await application.save();

        // Notify student
        const io = req.app.get('socketio');
        let notificationMsg = `Your application for ${application.companyName} has been updated to: ${application.status}.`;
        if (application.currentRound) notificationMsg += ` Current Round: ${application.currentRound}`;
        
        await notify(io, application.user, 'Placement Update 📣', notificationMsg, 'result_update');

        // Handle selectedCount and user placement status persistence
        if (application.status === 'Selected' && oldStatus !== 'Selected') {
            await Company.findByIdAndUpdate(application.company, { $inc: { selectedCount: 1 } });
            await User.findByIdAndUpdate(application.user, { 
                placementStatus: 'placed',
                placedCompany: application.companyName,
                package: application.package || 0
            });
        } else if (oldStatus === 'Selected' && application.status !== 'Selected') {
            await Company.findByIdAndUpdate(application.company, { $inc: { selectedCount: -1 } });
            await User.findByIdAndUpdate(application.user, { 
                placementStatus: 'applied',
                placedCompany: '',
                package: 0
            });
        }

        res.json(application);
    } catch (err) {
        console.error("Error in PATCH /api/applications/:id/status:", err);
        res.status(400).json({ message: err.message });
    }
});


// Bulk update application status (Admin Only)
router.patch('/bulk-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { ids, status: requestedStatus, roundsData } = req.body;
        console.log('Bulk Update Status Request:', { count: ids?.length, requestedStatus, roundsData });

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No application IDs provided' });
        }

        const results = [];
        for (const id of ids) {
            const application = await Application.findById(id).populate('company');
            if (!application) continue;

            const oldStatus = application.status;
            let targetStatus = requestedStatus || oldStatus;

            // Apply round completion mapping if provided
            if (roundsData) {
                try {
                    const { updatedRounds, finalStatus } = validateAndAdjustRounds(application, roundsData, application.company);
                    targetStatus = finalStatus;

                    let maxPassedRoundIndex = -1;
                    Object.keys(updatedRounds).forEach(key => {
                        application.set(key, updatedRounds[key], { strict: false });
                        application.markModified(key);

                        const roundMatch = key.match(/^round(\d+)$/);
                        if (roundMatch && updatedRounds[key] === 'pass') {
                            const roundIdx = parseInt(roundMatch[1]) - 1;
                            if (roundIdx > maxPassedRoundIndex) maxPassedRoundIndex = roundIdx;
                        }
                    });

                    if (maxPassedRoundIndex !== -1 && application.company?.rounds) {
                        const roundName = application.company.rounds[maxPassedRoundIndex]?.name || `Round ${maxPassedRoundIndex + 1}`;
                        application.currentRound = roundName;
                    }
                } catch (err) {
                    console.warn(`Skipping application ${id} due to validation error: ${err.message}`);
                    continue; 
                }
            }

            // Final Validation for 'Selected'
            if (targetStatus === 'Selected') {
                const rounds = application.company?.rounds || [];
                const total = rounds.length || 5;
                let canSelect = true;
                for (let i = 1; i <= total; i++) {
                    if (application.get(`round${i}`) !== 'pass') {
                        canSelect = false;
                        break;
                    }
                }
                if (!canSelect) {
                    console.warn(`Skipping application ${id}: Cannot set to Selected because not all rounds are passed.`);
                    continue;
                }
            }

            application.status = targetStatus;
            await application.save();

            // Notify student
            const io = req.app.get('socketio');
            let notificationMsg = `Your application for ${application.companyName} bulk update: ${targetStatus}.`;
            if (application.currentRound) notificationMsg += ` Current Round: ${application.currentRound}`;
            await notify(io, application.user, 'Placement Update 📣', notificationMsg, 'result_update');

            // Handle selectedCount
            if (application.status === 'Selected' && oldStatus !== 'Selected') {
                await Company.findByIdAndUpdate(application.company, { $inc: { selectedCount: 1 } });
                await User.findByIdAndUpdate(application.user, { 
                    placementStatus: 'placed',
                    placedCompany: application.companyName,
                    package: application.package || 0
                });
            } else if (oldStatus === 'Selected' && application.status !== 'Selected') {
                await Company.findByIdAndUpdate(application.company, { $inc: { selectedCount: -1 } });
                await User.findByIdAndUpdate(application.user, { 
                    placementStatus: 'applied',
                    placedCompany: '',
                    package: 0
                });
            }
            results.push(application._id);
        }

        const skippedCount = ids.length - results.length;
        res.json({ 
            message: `Successfully updated ${results.length} applications.${skippedCount > 0 ? ` ${skippedCount} skipped due to out-of-order rounds.` : ''}`, 
            ids: results,
            skippedCount
        });
    } catch (err) {
        console.error("Error in PATCH /api/applications/bulk-status:", err);
        res.status(400).json({ message: err.message });
    }
});


module.exports = router;
