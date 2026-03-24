require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        const admins = await User.find({ role: 'admin' });
        console.log('Total Admins:', admins.length);
        admins.forEach(a => console.log(`- Name: ${a.name}, Reg: ${a.registerNumber}, Email: ${a.email}`));

        process.exit(0);
    })
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });
