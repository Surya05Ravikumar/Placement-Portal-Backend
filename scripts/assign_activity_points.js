const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sr7056720_db_user:Surya%40123@placement-cluster.plsukwe.mongodb.net/placement_portal';

async function assignActivityPoints() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} students`);

        let updatedCount = 0;
        for (const student of students) {
            // Assign a unique-ish random point between 70 and 145 to ensure diff and min 70
            // Using a simple algorithm: 70 + (index * 7) % 75 to make it somewhat different but deterministic for this run
            // Or just a random one. Random is better as per user request.
            const randomPoints = Math.floor(Math.random() * (145 - 70 + 1)) + 70;
            
            let badgeLevel = 'Bronze';
            if (randomPoints > 120) badgeLevel = 'Gold';
            else if (randomPoints > 90) badgeLevel = 'Silver';

            student.activityPoints = {
                total: randomPoints,
                max: 150,
                badgeLevel: badgeLevel
            };

            await student.save();
            console.log(`Assigned ${randomPoints} points (Badge: ${badgeLevel}) to ${student.name} (${student.registerNumber})`);
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} students.`);
        process.exit(0);
    } catch (err) {
        console.error('Error assigning activity points:', err);
        process.exit(1);
    }
}

assignActivityPoints();
