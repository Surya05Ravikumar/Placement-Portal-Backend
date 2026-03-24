const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const adminEmail = process.env.ADMIN_EMAIL || 'sr7056720@gmail.com';
    const admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log('Admin found:', admin.name, '| ID:', admin._id);
    } else {
      console.log('Admin NOT found in DB with email:', adminEmail);
    }
    process.exit(0);
  });
