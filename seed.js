require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Application = require('./models/Application');
const Resource = require('./models/Resource');
const ResourceRequest = require('./models/ResourceRequest');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal')
    .then(() => console.log('Connected to MongoDB for Seeding'))
    .catch(err => {
        console.error('Failed to connect', err);
        process.exit(1);
    });

const seedDB = async () => {
    try {
        await User.deleteMany({});
        await Company.deleteMany({});
        await Application.deleteMany({});
        await Resource.deleteMany({});
        await ResourceRequest.deleteMany({});

        // 1. Seed Users (Students)
        const studentsData = [
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
                name: 'Amit Patel',
                registerNumber: '20EC103',
                email: 'amit.patel@college.edu',
                phone: '+91-9876543212',
                department: 'ECE',
                year: '2024',
                cgpa: '7.85',
                stream: 'B.E',
                gender: 'Male',
                placementStatus: 'eligible',
                skills: [{ name: 'C', level: 'advanced' }, { name: 'Embedded Systems', level: 'intermediate' }]
            },
            {
                name: 'Sneha Reddy',
                registerNumber: '20CS104',
                email: 'sneha.reddy@college.edu',
                phone: '+91-9876543213',
                department: 'CSE',
                year: '2024',
                cgpa: '8.45',
                stream: 'B.E',
                gender: 'Female',
                placementStatus: 'placed',
                placedCompany: 'Amazon',
                package: '45.0 LPA',
                skills: [{ name: 'Python', level: 'advanced' }, { name: 'ML', level: 'intermediate' }]
            }
        ];

        const seededStudents = await User.insertMany(studentsData);
        const user1 = seededStudents[0];

        // 2. Seed Companies (Updated Schema)
        const companiesData = [
            {
                name: 'Amazon',
                industry: 'IT / Software',
                website: 'https://amazon.jobs',
                location: 'Bangalore, India',
                description: 'Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking.',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
                jobRoles: [
                    {
                        role: 'Software Development Engineer I',
                        description: 'Work on planet-scale distributed systems.',
                        location: 'Bangalore',
                        workMode: 'onsite',
                        package: '45.0',
                        bonus: '5.0',
                        bond: 'None'
                    }
                ],
                eligibleBranches: ['CSE', 'IT', 'ECE'],
                minCGPA: 8.0,
                allowedBacklogs: 0,
                passingYear: 2024,
                applicationDeadline: new Date('2026-10-15'),
                status: 'upcoming'
            },
            {
                name: 'Microsoft',
                industry: 'IT / Software',
                website: 'https://careers.microsoft.com',
                location: 'Hyderabad, India',
                description: 'Our mission is to empower every person and every organization on the planet to achieve more.',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
                jobRoles: [
                    {
                        role: 'Program Manager',
                        description: 'Drive the vision and execution for Microsoft cloud products.',
                        location: 'Hyderabad',
                        workMode: 'hybrid',
                        package: '38.0',
                        bonus: '4.0',
                        bond: 'None'
                    }
                ],
                eligibleBranches: ['CSE', 'IT', 'ECE', 'EEE'],
                minCGPA: 7.5,
                allowedBacklogs: 0,
                passingYear: 2024,
                applicationDeadline: new Date('2026-09-30'),
                status: 'ongoing'
            },
            {
                name: 'TCS',
                industry: 'IT / Software',
                website: 'https://tcs.com/careers',
                location: 'Chennai, India',
                description: 'A purpose-led organization that is building a meaningful future through innovation, technology, and collective knowledge.',
                logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
                jobRoles: [
                    {
                        role: 'System Engineer',
                        description: 'Develop and maintain software solutions.',
                        location: 'Chennai',
                        workMode: 'onsite',
                        package: '7.0',
                        bonus: '0.5',
                        bond: '2 Years'
                    }
                ],
                eligibleBranches: ['All Branches'],
                minCGPA: 6.0,
                allowedBacklogs: 2,
                passingYear: 2024,
                applicationDeadline: new Date('2026-08-20'),
                status: 'completed'
            }
        ];

        const companies = await Company.insertMany(companiesData);

        // 3. Seed Application
        await Application.create({
            user: user1._id,
            company: companies[0]._id, // Amazon
            userRegisterNumber: user1.registerNumber,
            companyName: companies[0].name,
            status: 'Shortlisted',
            appliedDate: new Date('2026-09-15'),
            lastUpdate: new Date('2026-10-01'),
            progress: 80,
            currentRound: 'Technical Round 2'
        });

        // 4. Seed Resources
        const resourcesData = [
            // Web Dev
            { stack: 'web-dev', title: 'React.js Complete Guide', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-20'), size: '2.4 MB', url: '#' },
            { stack: 'web-dev', title: 'JavaScript Interview Questions', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-18'), size: '1.8 MB', url: '#' },
            { stack: 'web-dev', title: 'Node.js Tutorial Series', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-15'), url: 'https://youtube.com/example' },
            { stack: 'web-dev', title: 'Full Stack Development Roadmap', type: 'link', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-12'), url: 'https://roadmap.sh/full-stack' },
            { stack: 'web-dev', title: 'REST API Best Practices', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-10'), size: '1.2 MB', url: '#' },
            // Core
            { stack: 'core', title: 'Data Structures & Algorithms', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-22'), size: '3.5 MB', url: '#' },
            { stack: 'core', title: 'Operating Systems Concepts', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-19'), size: '2.8 MB', url: '#' },
            { stack: 'core', title: 'DBMS Complete Notes', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-16'), size: '2.1 MB', url: '#' },
            { stack: 'core', title: 'Computer Networks Tutorial', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-14'), url: 'https://youtube.com/example' },
            // Java
            { stack: 'java', title: 'Core Java Programming', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-21'), size: '3.2 MB', url: '#' },
            { stack: 'java', title: 'Java Collections Framework', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-17'), size: '1.5 MB', url: '#' },
            { stack: 'java', title: 'Spring Boot Masterclass', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-13'), url: 'https://youtube.com/example' },
            // Aptitude
            { stack: 'aptitude', title: 'Quantitative Aptitude', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-25'), size: '4.2 MB', url: '#' },
            { stack: 'aptitude', title: 'Logical Reasoning', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-23'), size: '2.9 MB', url: '#' },
            { stack: 'aptitude', title: 'Verbal Ability', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-20'), size: '1.7 MB', url: '#' },
            // HR
            { stack: 'hr', title: 'Common HR Interview Questions', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-24'), size: '0.9 MB', url: '#' },
            { stack: 'hr', title: 'Resume Writing Guide', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-21'), size: '1.1 MB', url: '#' },
            { stack: 'hr', title: 'Interview Preparation Tips', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-18'), url: 'https://youtube.com/example' }
        ];

        await Resource.insertMany(resourcesData);

        // 5. Seed Resource Requests
        await ResourceRequest.create({
            userRegisterNumber: user1.registerNumber,
            topic: 'Advanced React Patterns',
            stack: 'web-dev',
            date: new Date('2026-02-08'),
            status: 'Pending',
            description: 'Need a guide on compound components and render props.',
            note: ''
        });

        console.log("Database Seeded Successfully!");
        process.exit();
    } catch (err) {
        console.error("Error Seeding DB:", err);
        process.exit(1);
    }
};

seedDB();
