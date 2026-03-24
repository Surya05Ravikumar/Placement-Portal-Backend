const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sr7056720_db_user:Surya%40123@placement-cluster.plsukwe.mongodb.net/placement_portal';

async function migrateStudentData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ role: 'student' });
        console.log(`Found ${users.length} students`);

        let cgpaUpdatedCount = 0;
        let placementSyncedCount = 0;

        for (const user of users) {
            let userChanged = false;

            // 1. Round CGPA
            if (user.cgpa) {
                const originalCGPA = user.cgpa;
                const numericCGPA = parseFloat(originalCGPA);
                if (!isNaN(numericCGPA)) {
                    const roundedCGPA = (Math.round(numericCGPA * 10) / 10).toFixed(1);
                    if (originalCGPA !== roundedCGPA) {
                        user.cgpa = roundedCGPA;
                        userChanged = true;
                        cgpaUpdatedCount++;
                        console.log(`Updated CGPA for ${user.registerNumber}: ${originalCGPA} -> ${roundedCGPA}`);
                    }
                }
            }

            // 2. Sync Placement Data
            // Check for Selected applications
            const selectedApp = await Application.findOne({ 
                userRegisterNumber: user.registerNumber,
                status: { $in: ['Selected', 'selected', 'placed', 'Placed'] }
            });

            if (selectedApp) {
                if (user.placementStatus !== 'placed' || !user.placedCompany || !user.package) {
                    user.placementStatus = 'placed';
                    user.placedCompany = selectedApp.companyName;
                    user.package = selectedApp.package ? selectedApp.package.toString() : 'N/A';
                    userChanged = true;
                    placementSyncedCount++;
                    console.log(`Synced Placement for ${user.registerNumber}: Status -> placed, Company -> ${user.placedCompany}, Package -> ${user.package}`);
                }
            }

            if (userChanged) {
                await user.save();
            }
        }

        console.log(`\nMigration completed:`);
        console.log(`- CGPA updated for ${cgpaUpdatedCount} students.`);
        console.log(`- Placement data synced for ${placementSyncedCount} students.`);
        process.exit(0);
    } catch (err) {
        console.error('Error migrating student data:', err);
        process.exit(1);
    }
}

migrateStudentData();
