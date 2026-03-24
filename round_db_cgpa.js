const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sr7056720_db_user:Surya%40123@placement-cluster.plsukwe.mongodb.net/placement_portal';

async function roundAllCGPA() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({ cgpa: { $exists: true } });
        console.log(`Found ${users.length} users with CGPA`);

        let updatedCount = 0;
        for (const user of users) {
            if (user.cgpa) {
                const originalCGPA = user.cgpa;
                const roundedCGPA = Number(originalCGPA).toFixed(1);
                
                if (originalCGPA !== roundedCGPA) {
                    user.cgpa = roundedCGPA;
                    await user.save();
                    console.log(`Updated User ${user.registerNumber}: ${originalCGPA} -> ${roundedCGPA}`);
                    updatedCount++;
                }
            }
        }

        console.log(`Successfully updated ${updatedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Error updating CGPA:', err);
        process.exit(1);
    }
}

roundAllCGPA();
