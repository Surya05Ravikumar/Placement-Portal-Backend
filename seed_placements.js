require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB for Placement Seeding'))
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });

const seedPlacements = async () => {
    try {
        console.log('Finding or creating company...');
        let company = await Company.findOne({ name: 'Microsoft' });
        if (!company) {
            company = await Company.create({
                name: 'Microsoft',
                industry: 'Software & Cloud',
                website: 'https://microsoft.com',
                location: 'Redmond, WA',
                description: 'Microsoft is a global leader in software, services, and solutions.',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
                jobRoles: [{
                    role: 'Software Development Engineer',
                    description: 'Develop large scale cloud services.',
                    location: 'Hyderabad',
                    workMode: 'hybrid',
                    package: 45.0
                }],
                eligibleBranches: ['CSE', 'IT', 'ECE'],
                minCGPA: 8.0,
                passingYear: 2024,
                applicationDeadline: new Date('2026-12-31'),
                status: 'ongoing'
            });
            console.log('Created Microsoft company.');
        }

        const placementData = [
            {
                name: 'Suresh Raina',
                registerNumber: '20CS201',
                email: 'suresh.raina@college.edu',
                phone: '+91-9988776655',
                department: 'CSE',
                year: '2024',
                cgpa: '8.50',
                stream: 'B.E',
                gender: 'Male',
                placementStatus: 'placed',
                placedCompany: 'Microsoft',
                package: '45 LPA',
                skills: [{ name: 'C++', level: 'advanced' }, { name: 'Azure', level: 'intermediate' }]
            },
            {
                name: 'Mithali Raj',
                registerNumber: '20CS202',
                email: 'mithali.raj@college.edu',
                phone: '+91-9988776644',
                department: 'CSE',
                year: '2024',
                cgpa: '9.30',
                stream: 'B.E',
                gender: 'Female',
                placementStatus: 'placed',
                placedCompany: 'Microsoft',
                package: '45 LPA',
                skills: [{ name: 'Algorithms', level: 'advanced' }, { name: 'Java', level: 'advanced' }]
            },
            {
                name: 'Karthik Aryan',
                registerNumber: '20IT303',
                email: 'karthik.aryan@college.edu',
                phone: '+91-9988776633',
                department: 'IT',
                year: '2024',
                cgpa: '8.10',
                stream: 'B.Tech',
                gender: 'Male',
                placementStatus: 'placed',
                placedCompany: 'Microsoft',
                package: '45 LPA',
                skills: [{ name: 'Python', level: 'intermediate' }, { name: 'SQL', level: 'advanced' }]
            }
        ];

        console.log('Seeding placed students...');
        for (const data of placementData) {
            let user = await User.findOne({ registerNumber: data.registerNumber });
            if (user) {
                console.log(`User ${data.name} already exists, updating status.`);
                Object.assign(user, data);
                await user.save();
            } else {
                user = await User.create(data);
                console.log(`Created user ${data.name}.`);
            }

            // Create application
            const appExists = await Application.findOne({ user: user._id, company: company._id });
            if (!appExists) {
                await Application.create({
                    user: user._id,
                    company: company._id,
                    userRegisterNumber: user.registerNumber,
                    companyName: company.name,
                    status: 'Selected',
                    role: 'Software Development Engineer',
                    package: 45.0,
                    progress: 100,
                    currentRound: 'Hired',
                    timeline: [
                        { event: 'Applied', date: new Date(), type: 'success', description: 'Application submitted' },
                        { event: 'Selected', date: new Date(), type: 'success', description: 'Selected for the role' }
                    ]
                });
                console.log(`Created application for ${user.name}.`);
            } else if (appExists.status !== 'Selected') {
                appExists.status = 'Selected';
                appExists.progress = 100;
                await appExists.save();
                console.log(`Updated application for ${user.name} to Selected.`);
            }
        }

        console.log('--- PLACEMENT DATA SEEDED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('Error Seeding Placements:', err);
        process.exit(1);
    }
};

seedPlacements();
