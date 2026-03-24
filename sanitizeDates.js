require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');
const Company = require('./models/Company');

async function sanitize() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
        console.log('Connected to MongoDB');

        const getRandomDate = () => {
            const start = new Date(2025, 11, 1); // Dec 1, 2025
            const end = new Date(2026, 1, 28);  // Feb 28, 2026
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        };

        // 1. Sanitize Applications
        const applications = await Application.find({});
        console.log(`Checking ${applications.length} applications...`);
        let appCount = 0;
        for (let app of applications) {
            let updated = false;
            if (!app.updatedAt || isNaN(new Date(app.updatedAt).getTime())) {
                app.updatedAt = getRandomDate();
                updated = true;
            }
            if (!app.createdAt || isNaN(new Date(app.createdAt).getTime())) {
                app.createdAt = getRandomDate();
                updated = true;
            }
            if (updated) {
                await Application.findByIdAndUpdate(app._id, { 
                    createdAt: app.createdAt, 
                    updatedAt: app.updatedAt 
                }, { timestamps: false });
                appCount++;
            }
        }
        console.log(`Sanitized ${appCount} applications.`);

        // 2. Sanitize Companies
        const companies = await Company.find({});
        console.log(`Checking ${companies.length} companies...`);
        let compCount = 0;
        for (let comp of companies) {
            let updatedFields = {};
            if (!comp.driveDate || isNaN(new Date(comp.driveDate).getTime())) {
                updatedFields.driveDate = getRandomDate();
            }
            if (!comp.applicationDeadline || isNaN(new Date(comp.applicationDeadline).getTime())) {
                updatedFields.applicationDeadline = getRandomDate();
            }
            if (Object.keys(updatedFields).length > 0) {
                await Company.findByIdAndUpdate(comp._id, updatedFields);
                compCount++;
            }
        }
        console.log(`Sanitized ${compCount} companies.`);

        console.log('Database sanitation complete.');
        process.exit(0);
    } catch (err) {
        console.error('Sanitation error:', err);
        process.exit(1);
    }
}

sanitize();
