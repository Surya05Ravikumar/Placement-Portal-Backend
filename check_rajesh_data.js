const mongoose = require('mongoose');
require('dotenv').config();

async function checkRajesh() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placementPortal');
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            registerNumber: String
        }));

        const rajesh = await User.findOne({ name: /Rajesh/i });
        console.log('Rajesh data:', JSON.stringify(rajesh, null, 2));
        
        const allUsers = await User.find({}).limit(10);
        console.log('First 10 users:', allUsers.map(u => ({ name: u.name, email: u.email, regNo: u.registerNumber })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRajesh();
