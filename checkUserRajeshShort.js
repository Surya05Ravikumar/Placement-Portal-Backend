const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
        const user = await User.findOne({ registerNumber: '20CS101' });
        if (!user) {
            console.log('User 20CS101 not found');
        } else {
            console.log('Name:', user.name);
            console.log('CGPA:', user.cgpa);
            console.log('Status:', user.placementStatus);
            console.log('Company:', user.placedCompany);
            console.log('Package:', user.package);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkUser();
