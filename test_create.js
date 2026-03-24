const mongoose = require('mongoose');
const Company = require('./models/Company');

async function test() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/placement_portal');
        console.log('Connected');

        const companyData = {
            name: "Test Company " + Date.now(),
            industry: "Tech",
            location: "Remote",
            description: "Test description",
            applicationDeadline: new Date(),
            rounds: [
                { name: "Round 1", venue: "Online" }
            ],
            eligibleBranches: ["CSE"]
        };

        const company = new Company(companyData);
        await company.save();
        console.log('Success!');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

test();
