const mongoose = require('mongoose');
const Resource = require('./models/Resource');

async function checkResources() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/placement_portal');
        console.log("Connected to MongoDB");
        
        const resources = await Resource.find();
        console.log(`Found ${resources.length} resources.`);
        
        let updateCount = 0;
        for (const res of resources) {
            if (res.url === '#' || !res.url) {
                res.url = '/uploads/sample_resource.pdf';
                await res.save();
                updateCount++;
            }
        }
        console.log(`Updated ${updateCount} resources to point to dummy file.`);
        
        if (resources.length === 0) {
            console.log("No resources found. Seeding a dummy one...");
            const dummy = new Resource({
                stack: 'web-dev',
                title: 'Introduction to React - Dummy Guide',
                type: 'pdf',
                url: '/uploads/sample_resource.pdf',
                uploadedBy: 'Admin',
                difficulty: 'beginner'
            });
            await dummy.save();
            console.log("Dummy resource seeded.");
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkResources();
