require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Application = require('./models/Application');

async function selectStudents() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('Connected to MongoDB');

    // Find some applications to "select"
    const apps = await Application.find({ status: { $ne: 'Selected' } }).limit(5);

    for (const app of apps) {
      app.status = 'Selected';
      await app.save();

      // Update the user to "Placed"
      await User.updateOne(
        { _id: app.user },
        { 
          $set: { 
            placementStatus: 'placed',
            placedCompany: app.companyName
          } 
        }
      );
      console.log(`Student ${app.userRegisterNumber} is now PLACED at ${app.companyName}`);
    }

    console.log('Successfully updated 5 students to PLACED status.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating data:', error);
    process.exit(1);
  }
}

selectStudents();
