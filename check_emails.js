const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: 'c:/Users/surya/OneDrive/Documents/VS Studio Code/PBL/placement_portal/Backend/.env' });

async function checkEmails() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not found in .env');
        console.log('Connecting...');
        await mongoose.connect(uri);
        console.log('Connected.');
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log('User count:', users.length);
        if (users.length > 0) {
            console.log('User names:', users.map(u => u.name).join(', '));
            const rajesh = users.find(u => u.name && u.name.includes('Rajesh'));
            if (rajesh) {
                console.log('Rajesh details:', JSON.stringify({
                    name: rajesh.name,
                    email: rajesh.email,
                    registerNumber: rajesh.registerNumber
                }, null, 2));
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}

checkEmails();
