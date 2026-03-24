require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const companies = await db.collection('companies').find({}).toArray();
        console.log('Total Companies:', companies.length);
        if (companies.length > 0) {
            console.log('Sample Company Name:', companies[0].name);
            console.log('Sample Company Rounds:', JSON.stringify(companies[0].rounds));
            console.log('Type of first round:', typeof companies[0].rounds[0]);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
