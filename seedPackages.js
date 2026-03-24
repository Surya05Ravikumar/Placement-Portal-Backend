require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seedPackages() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    
    // Give some packages to people who are already placed but have no package value
    const updates = [
        { reg: '20CS101', pkg: 12.5, company: 'Amazon' },
        { reg: '20IT103', pkg: 6.8, company: 'TCS' },
        { reg: '20CV107', pkg: 4.5, company: 'L&T' },
        { reg: '20AD108', pkg: 15.0, company: 'Google' },
        { reg: '20IT112', pkg: 5.2, company: 'Infosys' },
        { reg: '20ME115', pkg: 3.5, company: 'Ashok Leyland' },
        { reg: '20AD117', pkg: 8.0, company: 'Microsoft' },
        { reg: '20CS123', pkg: 10.0, company: 'Meta' },
        { reg: '20AD125', pkg: 4.2, company: 'Wipro' }
    ];

    for (const item of updates) {
        await User.findOneAndUpdate(
            { registerNumber: item.reg },
            { 
                package: item.pkg, 
                placedCompany: item.company,
                placementStatus: 'placed' 
            }
        );
    }

    console.log('Seeded package data for existing placed students.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedPackages();
