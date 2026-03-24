const mongoose = require('mongoose');
const Resource = require('./models/Resource');
require('dotenv').config();

const resourcesData = [
    { stack: 'web-dev', title: 'React.js Complete Guide', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-20'), size: '2.4 MB', url: 'https://example.com/react.pdf', difficulty: 'beginner', views: 120, downloads: 45, visibility: 'public' },
    { stack: 'web-dev', title: 'Modern JS ES6+', type: 'link', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-22'), size: 'N/A', url: 'https://developer.mozilla.org', difficulty: 'beginner', views: 85, downloads: 0, visibility: 'public' },
    { stack: 'web-dev', title: 'Tailwind CSS Mastery', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-02-05'), size: '450 MB', url: 'https://youtube.com', difficulty: 'intermediate', views: 210, downloads: 12, visibility: 'public' },
    { stack: 'core', title: 'Database Management Systems', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-15'), size: '5.1 MB', url: 'https://example.com/dbms.pdf', difficulty: 'intermediate', views: 95, downloads: 30, visibility: 'public' },
    { stack: 'core', title: 'Operating Systems - 3 Kings', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-25'), size: '1.2 GB', url: 'https://youtube.com', difficulty: 'advanced', views: 150, downloads: 5, visibility: 'public' },
    { stack: 'java', title: 'Java SE 17 Docs', type: 'link', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-02-10'), size: 'N/A', url: 'https://docs.oracle.com', difficulty: 'beginner', views: 60, downloads: 0, visibility: 'public' },
    { stack: 'java', title: 'Spring Boot Microservices', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-02-15'), size: '3.8 MB', url: 'https://example.com/spring.pdf', difficulty: 'advanced', views: 45, downloads: 15, visibility: 'public' },
    { stack: 'aptitude', title: 'RS Aggarwal - Quantitative Aptitude', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-10'), size: '12 MB', url: 'https://example.com/aptitude.pdf', difficulty: 'beginner', views: 300, downloads: 150, visibility: 'public' },
    { stack: 'aptitude', title: 'Logic & Reasoning Practice', type: 'link', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-01-12'), size: 'N/A', url: 'https://indiabix.com', difficulty: 'beginner', views: 250, downloads: 0, visibility: 'public' },
    { stack: 'hr', title: 'HR Interview Questions', type: 'pdf', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-03-01'), size: '1.1 MB', url: 'https://example.com/hr.pdf', difficulty: 'beginner', views: 500, downloads: 200, visibility: 'public' },
    { stack: 'hr', title: 'Soft Skills & Communication', type: 'video', uploadedBy: 'Placement Cell', uploadDate: new Date('2026-03-05'), size: '800 MB', url: 'https://youtube.com', difficulty: 'beginner', views: 180, downloads: 8, visibility: 'public' }
];

async function seedResources() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Optional: clear existing resources if you want a clean state
         await Resource.deleteMany({});
         console.log('Cleared existing resources');

        await Resource.insertMany(resourcesData);
        console.log(`Successfully seeded ${resourcesData.length} resources.`);
        process.exit(0);
    } catch (err) {
        console.error('Error seeding resources:', err);
        process.exit(1);
    }
}

seedResources();
