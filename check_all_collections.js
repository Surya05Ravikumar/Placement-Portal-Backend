require('dotenv').config();
const mongoose = require('mongoose');

async function checkAll() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const collections = ['users', 'companies', 'applications', 'resources', 'resourcerequests', 'notifications', 'messages', 'reports', 'settings'];
        
        for (const colName of collections) {
            const count = await db.collection(colName).countDocuments();
            console.log(`Collection [${colName}]: ${count} documents`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkAll();
