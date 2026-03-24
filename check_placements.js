require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const placedStudents = await User.find({ placementStatus: 'placed' });
        console.log(`Total Placed Students: ${placedStudents.length}`);
        placedStudents.forEach(s => console.log(`- ${s.name} (${s.registerNumber}): ${s.placedCompany} @ ${s.package}`));

        const selectedApps = await Application.find({ status: 'Selected' });
        console.log(`Total Selected Applications: ${selectedApps.length}`);
        selectedApps.forEach(a => console.log(`- User Reg: ${a.userRegisterNumber}, Company: ${a.companyName}, Status: ${a.status}`));

        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });
