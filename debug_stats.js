const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Application = require('./models/Application');

async function debug() {
    try {
        await mongoose.connect('mongodb://localhost:27017/placement_portal'); // Adjusted to standard local DB name based on previous context
        console.log('Connected to DB');

        const apps = await Application.find({ status: 'Selected' }).limit(10).lean();
        console.log('Sample Selected Applications:');
        apps.forEach(app => {
            console.log(`App ID: ${app._id}, User Link: ${app.user}, RegNo: ${app.userRegisterNumber}, Status: ${app.status}`);
        });

        if (apps.length > 0) {
            const firstApp = apps[0];
            const user = await User.findById(firstApp.user).lean();
            console.log(`Checking linkage for first app: User found by ObjectId? ${!!user}`);
            if (user) {
                const countByObjectId = await Application.countDocuments({ user: user._id, status: 'Selected' });
                const countByRegNo = await Application.countDocuments({ userRegisterNumber: user.registerNumber, status: 'Selected' });
                console.log(`Stats for User ${user.registerNumber} (${user._id}):`);
                console.log(`- Count by ObjectId: ${countByObjectId}`);
                console.log(`- Count by RegNo: ${countByRegNo}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
