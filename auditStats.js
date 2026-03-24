const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');

async function runAudit() {
    await mongoose.connect('mongodb://localhost:27017/placement_portal');
    
    const batches = ['overall', '2024', '2027'];
    
    for (const batch of batches) {
        let userQuery = {};
        let companyQuery = {};
        let applicationQuery = {};

        if (batch !== 'overall') {
            userQuery.year = batch;
            companyQuery.passingYear = Number(batch);
            
            const batchUsers = await User.find({ year: batch }, '_id');
            const userIds = batchUsers.map(u => u._id);
            applicationQuery.user = { $in: userIds };
        }

        const stats = {
            totalStudents: await User.countDocuments(userQuery),
            placedStudents: await User.countDocuments({ ...userQuery, placementStatus: 'placed' }),
            companiesCount: await Company.countDocuments(companyQuery),
            totalApplications: await Application.countDocuments(applicationQuery)
        };

        console.log(`--- Statistics for Batch: ${batch} ---`);
        console.log(JSON.stringify(stats, null, 2));
    }
    
    process.exit();
}

runAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
