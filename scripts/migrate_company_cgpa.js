const mongoose = require('mongoose');
const Company = require('../models/Company');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sr7056720_db_user:Surya%40123@placement-cluster.plsukwe.mongodb.net/placement_portal';

async function migrateCompanyCGPA() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const companies = await Company.find({ minCGPA: { $exists: true } });
        console.log(`Found ${companies.length} companies with minCGPA`);

        let updatedCount = 0;
        for (const company of companies) {
            if (company.minCGPA !== undefined && company.minCGPA !== null) {
                const originalCGPA = company.minCGPA;
                // Round to 1 decimal place
                const roundedCGPA = Math.round(originalCGPA * 10) / 10;
                
                if (originalCGPA !== roundedCGPA) {
                    company.minCGPA = roundedCGPA;
                    await company.save();
                    console.log(`Updated Company ${company.name}: ${originalCGPA} -> ${roundedCGPA}`);
                    updatedCount++;
                }
            }
        }

        console.log(`Successfully updated ${updatedCount} companies.`);
        process.exit(0);
    } catch (err) {
        console.error('Error migrating Company CGPA:', err);
        process.exit(1);
    }
}

migrateCompanyCGPA();
