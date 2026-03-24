require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');

async function checkApp() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('Connected to MongoDB');

    const app = await Application.findOne({ userRegisterNumber: '20CS101' });
    if (!app) {
      console.log('Application for 20CS101 not found');
    } else {
      console.log('Application found:', app);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkApp();
