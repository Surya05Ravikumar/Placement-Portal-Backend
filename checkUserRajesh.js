const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ registerNumber: '20CS101' });
        if (!user) {
            console.log('User 20CS101 not found');
        } else {
            console.log('User found:', JSON.stringify(user, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
