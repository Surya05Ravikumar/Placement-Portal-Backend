const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: 'c:/Users/surya/OneDrive/Documents/VS Studio Code/PBL/placement_portal/Backend/.env' });

const User = require('./models/User');
const Message = require('./models/Message');
const Application = require('./models/Application');
const Company = require('./models/Company');

async function seedSurya() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI not found in .env');
        
        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const email = 'suryar.cs23@bitsathy.ac.in';
        const regNo = '23CS001';

        // Delete any existing user with this email or register number to avoid conflicts
        await User.deleteMany({ $or: [{ email }, { registerNumber: regNo }] });
        console.log('Cleaned up existing records.');

        const userData = {
            name: 'Surya Ravikumar',
            registerNumber: regNo,
            email: email,
            phone: '9876543210',
            mobile: '9876543210',
            password: 'password123',
            role: 'student',
            department: 'CSE',
            year: '2023',
            cgpa: '9.4',
            stream: 'B.E',
            gender: 'Male',
            dateOfBirth: new Date('2002-05-15'),
            activityPoints: {
                total: 135,
                max: 150,
                badgeLevel: 'Gold'
            },
            placementStatus: 'placed',
            placedCompany: 'Meta',
            package: '42.5',
            skills: [
                { name: 'React', level: 'advanced', category: 'Frontend' },
                { name: 'Node.js', level: 'advanced', category: 'Backend' },
                { name: 'MongoDB', level: 'intermediate', category: 'Database' },
                { name: 'TypeScript', level: 'intermediate', category: 'Frontend' }
            ],
            settings: {
                notifications: {
                    emailNotifications: true,
                    pushNotifications: true,
                    newCompanyAlerts: true,
                    placementCellMessages: true
                },
                appearance: {
                    theme: 'dark'
                }
            }
        };

        const user = await User.create(userData);
        console.log('Created new student user:', email);

        // Cleanup old applications for this regNo
        await Application.deleteMany({ userRegisterNumber: regNo });

        // Add dummy applications
        const companies = await Company.find({}).limit(5);
        if (companies.length > 0) {
            console.log('Adding dummy applications...');
            const apps = [
                {
                    user: user._id,
                    company: companies[0]._id, // Google
                    userRegisterNumber: regNo,
                    companyName: companies[0].name,
                    status: 'Applied',
                    progress: 20,
                    appliedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
                },
                {
                    user: user._id,
                    company: companies[1]._id, // Microsoft
                    userRegisterNumber: regNo,
                    companyName: companies[1].name,
                    status: 'Shortlisted',
                    progress: 60,
                    currentRound: 'Technical Interview',
                    appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
                },
                {
                    user: user._id,
                    company: companies[4]._id, // Meta
                    userRegisterNumber: regNo,
                    companyName: companies[4].name,
                    status: 'Selected',
                    progress: 100,
                    package: 42.5,
                    appliedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                    rounds: [
                        { roundName: 'OA', status: 'Completed', date: new Date() },
                        { roundName: 'Interview 1', status: 'Completed', date: new Date() },
                        { roundName: 'HR Round', status: 'Completed', date: new Date() }
                    ]
                }
            ];
            await Application.insertMany(apps);
        }

        // Send a welcome message if not present
        await Message.deleteMany({ receiver: regNo });
        console.log('Sending welcome message from admin...');
        await Message.create({
            sender: 'placement-cell',
            receiver: regNo,
            text: 'Welcome to the Placement Portal, Surya! We see you have been selected for Meta. Many congratulations!',
            isRead: false,
            timestamp: new Date()
        });

        console.log('Surya user profile seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('ERROR SEEDING:', err.message);
        process.exit(1);
    }
}

seedSurya();
