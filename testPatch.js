require('dotenv').config();
const mongoose = require('mongoose');
const Application = require('./models/Application');

async function testPatch() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('Connected to MongoDB');

    const app = await Application.findOne();
    if (!app) {
      console.log('No application found');
      process.exit(0);
    }

    console.log('Testing patch for app:', app._id);
    
    app.status = 'Pending';
    app.round1 = 'pass';
    app.markModified('round1');
    
    await app.save();
    console.log('Successfully saved app with Pending status and round1=pass');
    process.exit(0);
  } catch (err) {
    console.error('Patch test failed:', err);
    process.exit(1);
  }
}

testPatch();
