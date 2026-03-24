/**
 * One-time script: Updates a user's email in MongoDB to their Google/Gmail
 * so that the /byEmail login lookup works correctly.
 *
 * Usage: node patchUserEmail.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const REGISTER_NUMBER = '20CS101';           // The student's register number in DB
const NEW_EMAIL = 'sr7056720@gmail.com'; // Their actual Google/Gmail address
// ─────────────────────────────────────────────────────────────────────────────

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => { console.error(err); process.exit(1); });

const run = async () => {
    try {
        const user = await User.findOne({ registerNumber: REGISTER_NUMBER });
        if (!user) {
            console.error(`❌ No user found with registerNumber: ${REGISTER_NUMBER}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        user.email = NEW_EMAIL;
        await user.save();
        console.log(`✅ Email updated to: ${NEW_EMAIL}`);
        console.log(`   registerNumber : ${user.registerNumber}`);
        console.log(`   name           : ${user.name}`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
