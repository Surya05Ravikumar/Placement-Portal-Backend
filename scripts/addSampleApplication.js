/**
 * Script: addSampleApplication.js
 * Seeds a sample application for a student → test2 company.
 * Run: node scripts/addSampleApplication.js
 */

const mongoose = require('mongoose');
const Application = require('../models/Application');
const User = require('../models/User');
const Company = require('../models/Company');

const DB_URI = 'mongodb://localhost:27017/placement_portal'; // update if different

async function main() {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');

    // 1. Find test2 company (case-insensitive)
    const company = await Company.findOne({ name: /test2/i });
    if (!company) {
        console.error('❌ Company "test2" not found. Make sure it exists in the DB.');
        process.exit(1);
    }
    console.log(`✅ Found company: ${company.name} (${company._id})`);

    // 2. Find a student user
    const student = await User.findOne({ role: 'student' });
    if (!student) {
        console.error('❌ No student found in the DB.');
        process.exit(1);
    }
    console.log(`✅ Found student: ${student.name} (${student.registerNumber})`);

    // 3. Check for duplicate
    const existing = await Application.findOne({ user: student._id, company: company._id });
    if (existing) {
        console.log(`ℹ️  Application already exists (status: ${existing.status}). No duplicate created.`);
        process.exit(0);
    }

    // 4. Create application with status 'Applied'
    const app = new Application({
        user: student._id,
        company: company._id,
        userRegisterNumber: student.registerNumber,
        companyName: company.name,
        status: 'Applied',
        appliedDate: new Date(),
        lastUpdate: new Date(),
        progress: 20,
    });

    await app.save();
    console.log(`✅ Application created successfully!`);
    console.log(`   Student : ${student.name} (${student.registerNumber})`);
    console.log(`   Company : ${company.name}`);
    console.log(`   Status  : Applied`);
    console.log(`   App ID  : ${app._id}`);

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
