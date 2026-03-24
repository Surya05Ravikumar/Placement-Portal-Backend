require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./models/Company');

async function seedTimeline() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('Connected to MongoDB');

    const companies = await Company.find({ $or: [{ rounds: { $exists: false } }, { rounds: { $size: 0 } }] });

    if (companies.length === 0) {
      console.log('All companies already have timelines.');
      process.exit(0);
    }

    const defaultRounds = ["Aptitude Test", "Technical Interview", "HR Interview"];

    for (const company of companies) {
      company.rounds = defaultRounds;
      await company.save();
      console.log(`Updated timeline for ${company.name}`);
    }

    console.log(`Successfully updated ${companies.length} companies with default timelines.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding timeline:', error);
    process.exit(1);
  }
}

seedTimeline();
