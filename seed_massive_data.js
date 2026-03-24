require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB for Expanded Massive Seeding'))
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });

const seedMassiveData = async () => {
    try {
        console.log('Clearing existing companies and applications...');
        await Company.deleteMany({});
        await Application.deleteMany({});

        const students = await User.find({ role: 'student' }).limit(3);
        if (students.length === 0) {
            console.error('No student users found. Please run seed_all_data.js first.');
            process.exit(1);
        }

        const industries = ['Cloud & AI', 'Software', 'E-commerce', 'Streaming', 'Social Media', 'Finance', 'IT Services', 'Consulting', 'Automotive', 'Aerospace', 'Semiconductors'];
        const locations = ['Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Mumbai', 'Noida', 'Gurgaon', 'Coimbatore', 'Mysore'];
        const rolesPool = ['SDE I', 'Backend Dev', 'Frontend Dev', 'Fullstack Developer', 'Data Analyst', 'Product Manager', 'UX Designer', 'Systems Engineer', 'Cloud Architect', 'Embedded Engineer'];
        const branchesPool = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'AERO', 'CIVIL', 'AIDS', 'AIML'];

        const companyNames = [
            'Google', 'Microsoft', 'Amazon', 'Netflix', 'Meta', 'Apple', 'Accenture', 'TCS', 'Infosys', 'Wipro',
            'Cognizant', 'J.P. Morgan', 'Goldman Sachs', 'Morgan Stanley', 'Zomato', 'Swiggy', 'Uber', 'Tesla', 'SpaceX', 'Adobe',
            'Oracle', 'IBM', 'Cisco', 'Intel', 'Nvidia', 'Samsung', 'Sony', 'HP', 'Dell', 'AMD', 'Qualcomm', 'Atlassian', 'Salesforce', 'ServiceNow', 'Slack'
        ];

        const seededCompanies = [];
        const now = new Date();

        for (let i = 0; i < companyNames.length; i++) {
            const name = companyNames[i];
            const industry = industries[i % industries.length];
            const location = locations[i % locations.length];
            
            // Determine year and status
            let year, status;
            if (i < 25) {
                // Original distribution
                year = i % 3 === 0 ? 2023 : i % 3 === 1 ? 2024 : 2025;
                status = i < 8 ? 'upcoming' : i < 16 ? 'ongoing' : 'completed';
            } else if (i < 30) {
                // 2026 Batch
                year = 2026;
                status = 'upcoming';
            } else {
                // 2027 Batch
                year = 2027;
                status = 'upcoming';
            }

            const minCGPA = 6.0 + (Math.random() * 3.5);

            // Generate unique, explicitly declared dates
            // If the year is 2026 or 2027, the dates should be further into the future
            let applicationStart, applicationDeadline, driveDate;
            if (year >= 2026) {
                const yearDiff = year - 2025;
                applicationStart = new Date(now.getFullYear() + yearDiff, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            } else {
                applicationStart = new Date(now.getTime() - (30 - i) * 24 * 60 * 60 * 1000); 
            }
            applicationDeadline = new Date(applicationStart.getTime() + 20 * 24 * 60 * 60 * 1000);
            driveDate = new Date(applicationDeadline.getTime() + 10 * 24 * 60 * 60 * 1000);

            // Generate 1-3 job roles
            const numRoles = Math.floor(Math.random() * 3) + 1;
            const jobRoles = [];
            for (let r = 0; r < numRoles; r++) {
                jobRoles.push({
                    role: rolesPool[Math.floor(Math.random() * rolesPool.length)],
                    description: `Join us as a ${name} team member for cutting-edge projects.`,
                    location: location,
                    workMode: Math.random() > 0.5 ? 'onsite' : 'hybrid',
                    package: (5 + Math.random() * 30).toFixed(1),
                    bonus: (Math.random() * 5).toFixed(1),
                    bond: Math.random() > 0.7 ? '2 Years' : 'None'
                });
            }

            // Generate 3-5 rounds
            const rounds = [
                { name: 'Quantitative Aptitude', venue: 'Online Assessment' },
                { name: 'Technical MCQ', venue: 'Online Assessment' },
                { name: 'Coding Challenge', venue: 'Hackerrank/Codility' }
            ];
            if (Math.random() > 0.5) rounds.push({ name: 'System Design', venue: 'Virtual' });
            rounds.push({ name: 'Technical Interview', venue: 'In-person' });
            rounds.push({ name: 'HR Interview', venue: 'Admin Block' });

            const company = await Company.create({
                name: name,
                industry: industry,
                location: location,
                description: `${name} is looking for bright minds for the ${year} batch in ${industry} domain.`,
                website: `https://${name.toLowerCase().replace(/\s/g, '')}.com/careers`,
                status: status,
                passingYear: year,
                minCGPA: minCGPA,
                eligibleBranches: [branchesPool[i % branchesPool.length], branchesPool[(i + 1) % branchesPool.length]],
                applicationStart: applicationStart,
                applicationDeadline: applicationDeadline,
                driveDate: driveDate,
                jobRoles: jobRoles,
                rounds: rounds,
                maxApplications: 200 + i * 10,
                jobType: i % 4 === 0 ? 'intern' : 'fulltime'
            });
            seededCompanies.push(company);
        }

        console.log(`Seeded ${seededCompanies.length} companies with unique dates, roles, and future batches (2026, 2027).`);

        // Seed some applications for varied dates and time periods
        console.log('Seeding applications...');
        const appStatuses = ['Shortlisted', 'Applied', 'In-Progress', 'Selected', 'Rejected'];
        for (let i = 0; i < 50; i++) {
            const student = students[Math.floor(Math.random() * students.length)];
            const company = seededCompanies[Math.floor(Math.random() * seededCompanies.length)];
            const status = appStatuses[Math.floor(Math.random() * appStatuses.length)];
            const role = company.jobRoles[0];
            
            await Application.create({
                user: student._id,
                company: company._id,
                userRegisterNumber: student.registerNumber,
                companyName: company.name,
                status: status,
                appliedDate: new Date(company.applicationStart.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000),
                progress: Math.floor(Math.random() * 100),
                role: role.role,
                package: role.package
            });
        }

        console.log('Expanded massive seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('Error during expanded massive seeding:', err);
        process.exit(1);
    }
};

seedMassiveData();
