require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');
const Resource = require('./models/Resource');
const ResourceRequest = require('./models/ResourceRequest');
const Notification = require('./models/Notification');
const Message = require('./models/Message');
const Report = require('./models/Report');
const Settings = require('./models/Settings');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal')
    .then(() => console.log('Connected to MongoDB for Comprehensive Seeding'))
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });

const seedDB = async () => {
    try {
        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Company.deleteMany({});
        await Application.deleteMany({});
        await Resource.deleteMany({});
        await ResourceRequest.deleteMany({});
        await Notification.deleteMany({});
        await Message.deleteMany({});
        await Report.deleteMany({});
        await Settings.deleteMany({});

        // 1. Seed Settings
        console.log('Seeding Settings...');
        await Settings.create({
            allowIneligible: false,
            allowMultipleApps: true,
            enableFCFS: true,
            enableOpenApps: true,
            autoCloseDrive: true,
            notifyNewCompany: true,
            notifyAccepted: true,
            notifyResult: true,
            autoMarkPlaced: true,
            requireResume: true,
            maxApplicationsRequired: true,
            allowEditProfile: true,
            allowWithdraw: true,
            maintenanceMode: false
        });

        // 2. Seed Users
        console.log('Seeding Users...');
        const adminEmail = process.env.ADMIN_EMAIL || 'sr7056720@gmail.com';
        const usersData = [
            {
                name: 'Admin User',
                registerNumber: 'ADMIN001',
                email: adminEmail,
                role: 'admin',
                department: 'Placement Cell',
                designation: 'Placement Head'
            },
            {
                name: 'Rajesh Kumar',
                registerNumber: '20CS101',
                email: 'rajesh.kumar@college.edu',
                phone: '+91-9876543210',
                department: 'CSE',
                year: '2024',
                cgpa: '8.75',
                stream: 'B.E',
                gender: 'Male',
                placementStatus: 'shortlisted',
                skills: [{ name: 'React', level: 'advanced' }, { name: 'Python', level: 'advanced' }]
            },
            {
                name: 'Priya Sharma',
                registerNumber: '20IT102',
                email: 'priya.sharma@college.edu',
                phone: '+91-9876543211',
                department: 'IT',
                year: '2024',
                cgpa: '9.12',
                stream: 'B.Tech',
                gender: 'Female',
                placementStatus: 'applied',
                skills: [{ name: 'Java', level: 'advanced' }, { name: 'AWS', level: 'intermediate' }]
            },
            {
                name: 'Anish V',
                registerNumber: '20ME305',
                email: 'anish.v@college.edu',
                phone: '+91-9876543215',
                department: 'MECH',
                year: '2024',
                cgpa: '8.20',
                stream: 'B.E',
                gender: 'Male',
                placementStatus: 'eligible'
            }
        ];
        const users = await User.insertMany(usersData);
        const adminId = users[0]._id;
        const rajesh = users[1];
        const priya = users[2];

        // 3. Seed Companies
        console.log('Seeding Companies...');
        const companiesData = [
            {
                name: 'Google',
                industry: 'Cloud & AI',
                website: 'https://careers.google.com',
                location: 'Mountain View, CA',
                description: 'Google is a global leader in search, advertising, and cloud technologies.',
                logo: 'https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24px.svg',
                jobRoles: [{
                    role: 'Software Engineer',
                    description: 'Build next-gen search features.',
                    location: 'Bangalore',
                    workMode: 'hybrid',
                    package: 55.0
                }],
                eligibleBranches: ['CSE', 'IT'],
                minCGPA: 8.5,
                passingYear: 2024,
                applicationDeadline: new Date('2026-10-20'),
                status: 'upcoming'
            },
            {
                name: 'Accenture',
                industry: 'Consulting',
                website: 'https://accenture.com',
                location: 'Dublin, Ireland',
                description: 'Accenture is a leading global professional services company.',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg',
                jobRoles: [{
                    role: 'Associate Software Engineer',
                    description: 'Work on enterprise digital transformation.',
                    location: 'Chennai',
                    workMode: 'onsite',
                    package: 6.5
                }],
                eligibleBranches: ['All Branches'],
                minCGPA: 6.5,
                passingYear: 2024,
                applicationDeadline: new Date('2026-09-05'),
                status: 'ongoing'
            }
        ];
        const companies = await Company.insertMany(companiesData);

        // 4. Seed Applications
        console.log('Seeding Applications...');
        await Application.create([
            {
                user: rajesh._id,
                company: companies[0]._id,
                userRegisterNumber: rajesh.registerNumber,
                companyName: companies[0].name,
                status: 'Shortlisted',
                currentRound: 'Interview Round 1',
                progress: 60
            },
            {
                user: priya._id,
                company: companies[1]._id,
                userRegisterNumber: priya.registerNumber,
                companyName: companies[1].name,
                status: 'Applied',
                progress: 20
            }
        ]);

        // 5. Seed Resources
        console.log('Seeding Resources...');
        await Resource.create([
            { stack: 'web-dev', title: 'Modern React with Redux', type: 'pdf', url: 'https://example.com/react.pdf', difficulty: 'intermediate' },
            { stack: 'core', title: 'Data Structures Visualized', type: 'link', url: 'https://visualgo.net', difficulty: 'beginner' }
        ]);

        // 6. Seed Resource Requests
        console.log('Seeding Resource Requests...');
        await ResourceRequest.create({
            userRegisterNumber: rajesh.registerNumber,
            topic: 'System Design Interview',
            stack: 'core',
            status: 'Pending',
            description: 'Need resources for scalable architecture.'
        });

        // 7. Seed Notifications
        console.log('Seeding Notifications...');
        await Notification.create([
            {
                recipient: rajesh._id,
                title: 'Shortlisted!',
                message: 'You have been shortlisted for the Google interview.',
                type: 'result_update'
            },
            {
                recipient: priya._id,
                title: 'New Drive',
                message: 'Accenture is now hiring for the 2024 batch.',
                type: 'new_company'
            }
        ]);

        // 8. Seed Messages
        console.log('Seeding Messages...');
        await Message.create({
            sender: rajesh._id.toString(),
            receiver: adminId.toString(),
            text: 'Sir, I have a doubt regarding the Google interview venue.'
        });

        // 9. Seed Reports
        console.log('Seeding Reports...');
        await Report.create({
            title: 'Placement Summary 2024',
            type: 'Placement Progress',
            stats: { total: 400, placed: 120 }
        });

        console.log('--- DATABASE SEEDED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('Error Seeding DB:', err);
        process.exit(1);
    }
};

seedDB();
