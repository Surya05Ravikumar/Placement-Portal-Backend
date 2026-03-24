require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal');
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student' });
    const companies = await Company.find();

    if (companies.length === 0) {
      console.log('No companies found to apply to.');
      process.exit(0);
    }
    
    let applicationsCreated = 0;

    for (const student of students) {
      // randomly pick 1-3 companies to apply for
      const numApplications = Math.floor(Math.random() * 3) + 1; // 1 to 3
      
      const shuffledCompanies = [...companies].sort(() => 0.5 - Math.random());
      const selectedCompanies = shuffledCompanies.slice(0, numApplications);

      for (const company of selectedCompanies) {
        // Check if already applied
        const existingApp = await Application.findOne({ user: student._id, company: company._id });
        if (!existingApp) {
          const app = new Application({
            user: student._id,
            company: company._id,
            userRegisterNumber: student.registerNumber || 'Unknown',
            companyName: company.name,
            status: ['Applied', 'Shortlisted', 'In-Progress'][Math.floor(Math.random() * 3)],
            role: company.jobRoles && company.jobRoles.length > 0 ? company.jobRoles[0].title : 'Software Engineer',
            package: company.jobRoles && company.jobRoles.length > 0 ? company.jobRoles[0].package : 0,
            progress: Math.floor(Math.random() * 100),
            rounds: [],
            timeline: []
          });
          await app.save();
          applicationsCreated++;
          
          await User.updateOne(
            { _id: student._id },
            { $inc: { applicationsCount: 1 } }
          );
        }
      }
    }
    
    console.log(`Created ${applicationsCreated} new applications for students!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
