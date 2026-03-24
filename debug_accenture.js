require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
        
        const rajesh = await User.findOne({ registerNumber: '20CS101' });
        console.log('RAJESH DATA:');
        if (rajesh) {
            console.log(JSON.stringify({
                name: rajesh.name,
                dept: rajesh.department,
                cgpa: rajesh.cgpa,
                year: rajesh.year,
                points: rajesh.activityPoints,
                status: rajesh.placementStatus,
                package: rajesh.package,
                placedCompany: rajesh.placedCompany
            }, null, 2));
        } else {
            console.log('Rajesh not found');
        }

        const accenture = await Company.findOne({ name: /Accenture/i });
        console.log('\nACCENTURE DATA:');
        if (accenture) {
            console.log(JSON.stringify({
                _id: accenture._id,
                name: accenture.name,
                branches: accenture.eligibleBranches,
                minCGPA: accenture.minCGPA,
                requiredPoints: accenture.requiredPoints,
                passingYear: accenture.passingYear,
                status: accenture.status
            }, null, 2));
        } else {
            console.log('Accenture not found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
