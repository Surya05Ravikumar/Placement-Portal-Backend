const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

async function checkStudents() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const query = { 
            role: 'student', 
            $or: [
                { name: { $regex: 'raj', $options: 'i' } }, 
                { registerNumber: { $regex: 'raj', $options: 'i' } }
            ] 
        };
        
        const users = await User.find(query).select('name registerNumber role');
        console.log('Students matching "raj":', JSON.stringify(users, null, 2));
        
        if (users.length === 0) {
            console.log('No students found with "raj" in name or registerNumber');
            const anyStudents = await User.find({ role: 'student' }).limit(5).select('name registerNumber');
            console.log('Sample students in DB:', JSON.stringify(anyStudents, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStudents();
